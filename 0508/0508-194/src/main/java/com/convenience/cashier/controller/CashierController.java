package com.convenience.cashier.controller;

import com.convenience.cashier.entity.CartItem;
import com.convenience.cashier.entity.Member;
import com.convenience.cashier.entity.Order;
import com.convenience.cashier.entity.Product;
import com.convenience.cashier.service.MemberService;
import com.convenience.cashier.service.OrderService;
import com.convenience.cashier.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class CashierController {
    @Autowired
    private ProductService productService;
    
    @Autowired
    private MemberService memberService;
    
    @Autowired
    private OrderService orderService;

    @GetMapping("/product/{barcode}")
    public ResponseEntity<Product> getProduct(@PathVariable String barcode) {
        Product product = productService.getProductByBarcode(barcode);
        if (product == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(product);
    }

    @GetMapping("/products")
    public Map<String, Product> getAllProducts() {
        return productService.getAllProducts();
    }

    @GetMapping("/member/{phone}")
    public ResponseEntity<Member> getMember(@PathVariable String phone) {
        Member member = memberService.getMemberByPhone(phone);
        if (member == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(member);
    }

    @PostMapping("/member/register")
    public Member registerMember(@RequestBody Map<String, String> params) {
        return memberService.registerMember(params.get("phone"), params.get("name"));
    }

    @PostMapping("/checkout")
    public Order checkout(@RequestBody Map<String, Object> params) {
        List<Map<String, Object>> itemsMap = (List<Map<String, Object>>) params.get("items");
        List<CartItem> items = new ArrayList<>();
        for (Map<String, Object> itemMap : itemsMap) {
            Map<String, Object> productMap = (Map<String, Object>) itemMap.get("product");
            Product product = new Product(
                (String) productMap.get("barcode"),
                (String) productMap.get("name"),
                ((Number) productMap.get("price")).doubleValue()
            );
            int quantity = ((Number) itemMap.get("quantity")).intValue();
            items.add(new CartItem(product, quantity));
        }
        String memberPhone = (String) params.get("memberPhone");
        return orderService.createOrder(items, memberPhone);
    }
}
