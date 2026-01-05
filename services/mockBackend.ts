import { Product, User, UserRole, Order, CheckoutResult, CartItem } from '../types';

// Constants for LocalStorage keys
const DB_PRODUCTS_KEY = 'lumina_db_products';
const DB_USERS_KEY = 'lumina_db_users';
const DB_ORDERS_KEY = 'lumina_db_orders';

// Initial Mock Data
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Wireless Noise Cancelling Headphones',
    description: 'Premium sound quality with active noise cancellation and 30h battery life.',
    price: 299.99,
    stock: 15,
    category: 'Electronics',
    imageUrl: 'https://picsum.photos/400/400?random=1'
  },
  {
    id: 'p2',
    name: 'Ergonomic Office Chair',
    description: 'Lumbar support and breathable mesh for long working hours.',
    price: 199.50,
    stock: 5,
    category: 'Furniture',
    imageUrl: 'https://picsum.photos/400/400?random=2'
  },
  {
    id: 'p3',
    name: 'Organic Green Tea (50 bags)',
    description: 'Sourced from high-altitude gardens. Rich in antioxidants.',
    price: 12.99,
    stock: 100,
    category: 'Grocery',
    expiryDate: '2025-12-31',
    imageUrl: 'https://picsum.photos/400/400?random=3'
  },
  {
    id: 'p4',
    name: 'Smart Fitness Watch',
    description: 'Track your heart rate, steps, and sleep. Waterproof.',
    price: 89.00,
    stock: 2, // Low stock for testing
    category: 'Electronics',
    imageUrl: 'https://picsum.photos/400/400?random=4'
  }
];

class MockBackendService {
  private products: Product[] = [];
  private orders: Order[] = [];
  private otpStore: Map<string, string> = new Map();

  constructor() {
    this.init();
  }

  private init() {
    // Load from LocalStorage or seed
    const storedProducts = localStorage.getItem(DB_PRODUCTS_KEY);
    if (storedProducts) {
      this.products = JSON.parse(storedProducts);
    } else {
      this.products = [...INITIAL_PRODUCTS];
      this.saveProducts();
    }

    const storedOrders = localStorage.getItem(DB_ORDERS_KEY);
    if (storedOrders) {
      this.orders = JSON.parse(storedOrders);
    }
  }

  private saveProducts() {
    localStorage.setItem(DB_PRODUCTS_KEY, JSON.stringify(this.products));
  }

  private saveOrders() {
    localStorage.setItem(DB_ORDERS_KEY, JSON.stringify(this.orders));
  }

  // --- Public API Simulation ---

  // Simulate Network Latency
  private async delay(ms: number = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async login(phoneNumber: string): Promise<{ success: boolean; otp?: string }> {
    await this.delay(300);
    // Generate a random 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    this.otpStore.set(phoneNumber, otp);
    
    return { success: true, otp };
  }

  async verifyOtp(phoneNumber: string, otp: string): Promise<User | null> {
    console.log(`[MockBackend] Verifying OTP: '${otp}' for ${phoneNumber}`);
    await this.delay(500);
    
    const storedOtp = this.otpStore.get(phoneNumber);
    
    // Robust check: trim whitespace and ensure type safety
    if (storedOtp && otp && otp.toString().trim() === storedOtp) {
      // Clear OTP after successful use
      this.otpStore.delete(phoneNumber);

      // Mock User Retrieval/Creation
      // Owner logic is hidden here in backend
      const role = phoneNumber === '9999999999' ? UserRole.OWNER : UserRole.USER;
      const user: User = {
        id: `u_${phoneNumber}`,
        phoneNumber,
        role,
        name: role === UserRole.OWNER ? 'Store Owner' : `User ${phoneNumber.slice(-4)}`
      };
      return user;
    }
    return null;
  }

  async getProducts(): Promise<Product[]> {
    await this.delay(400);
    // Always re-read from storage to ensure we see updates from other "tabs"
    this.init(); 
    return [...this.products];
  }

  async addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    await this.delay(600);
    this.init(); // Sync first
    const newProduct: Product = {
      ...product,
      id: `p${Date.now()}`,
      imageUrl: product.imageUrl || `https://picsum.photos/400/400?random=${Date.now()}`
    };
    this.products.push(newProduct);
    this.saveProducts();
    return newProduct;
  }

  async updatePrice(id: string, newPrice: number): Promise<boolean> {
    await this.delay(300);
    this.init();
    const product = this.products.find(p => p.id === id);
    if (product) {
      product.price = newPrice;
      this.saveProducts();
      return true;
    }
    return false;
  }

  async deleteProduct(id: string): Promise<boolean> {
    await this.delay(300);
    this.init();
    const initialLen = this.products.length;
    this.products = this.products.filter(p => p.id !== id);
    if (this.products.length !== initialLen) {
      this.saveProducts();
      return true;
    }
    return false;
  }

  // CORE LOGIC: Safe Checkout with Concurrency Check
  async checkout(userId: string, cartItems: CartItem[]): Promise<CheckoutResult> {
    await this.delay(1500); // Simulate payment processing time
    this.init(); // CRITICAL: Re-fetch latest state from "Database"

    const outOfStockItems: string[] = [];
    const productsToUpdate: Product[] = [];

    // 1. Validation Phase (Locking mechanism simulated)
    for (const item of cartItems) {
      const dbProduct = this.products.find(p => p.id === item.id);
      
      if (!dbProduct) {
        outOfStockItems.push(item.id); // Product deleted meanwhile
        continue;
      }

      if (dbProduct.stock < item.quantity) {
        outOfStockItems.push(item.id); // Insufficient stock
      } else {
        // Prepare updated state in memory
        productsToUpdate.push({
          ...dbProduct,
          stock: dbProduct.stock - item.quantity
        });
      }
    }

    // 2. Transaction Phase
    if (outOfStockItems.length > 0) {
      return {
        success: false,
        message: 'Some items are no longer available in the requested quantity.',
        outOfStockItems
      };
    }

    // Apply updates atomically (conceptually)
    this.products = this.products.map(p => {
      const update = productsToUpdate.find(up => up.id === p.id);
      return update ? update : p;
    });
    this.saveProducts();

    // 3. Record Order
    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      userId,
      items: cartItems,
      totalAmount: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      date: new Date().toISOString(),
      status: 'COMPLETED'
    };
    this.orders.push(newOrder);
    this.saveOrders();

    return {
      success: true,
      message: 'Payment successful! Order placed.',
      orderId: newOrder.id
    };
  }
}

export const mockBackend = new MockBackendService();