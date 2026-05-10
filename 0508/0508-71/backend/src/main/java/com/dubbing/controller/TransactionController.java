package com.dubbing.controller;

import com.dubbing.common.Result;
import com.dubbing.entity.Transaction;
import com.dubbing.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/transaction")
public class TransactionController {

    @Autowired
    private TransactionService transactionService;

    @PostMapping("/withdraw")
    public Result<Void> withdraw(@RequestParam BigDecimal amount) {
        transactionService.withdraw(amount);
        return Result.success("提现成功");
    }

    @GetMapping("/my")
    public Result<List<Transaction>> getMyTransactions() {
        List<Transaction> transactions = transactionService.getMyTransactions();
        return Result.success(transactions);
    }
}
