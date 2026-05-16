package com.convenience.cashier.service;

import com.convenience.cashier.entity.Product;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class ProductService {
    private Map<String, Product> products = new HashMap<>();

    public ProductService() {
        products.put("6901234567890", new Product("6901234567890", "矿泉水", 2.00));
        products.put("6901234567891", new Product("6901234567891", "可乐", 3.50));
        products.put("6901234567892", new Product("6901234567892", "面包", 5.00));
        products.put("6901234567893", new Product("6901234567893", "牛奶", 6.50));
        products.put("6901234567894", new Product("6901234567894", "方便面", 4.00));
        products.put("6901234567895", new Product("6901234567895", "火腿肠", 2.50));
        products.put("6901234567896", new Product("6901234567896", "巧克力", 8.00));
        products.put("6901234567897", new Product("6901234567897", "薯片", 6.00));
    }

    public Product getProductByBarcode(String barcode) {
        return products.get(barcode);
    }

    public Map<String, Product> getAllProducts() {
        return products;
    }
}
