package com.dubbing.controller;

import com.dubbing.common.Result;
import com.dubbing.entity.Portfolio;
import com.dubbing.service.PortfolioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/portfolio")
public class PortfolioController {

    @Autowired
    private PortfolioService portfolioService;

    @GetMapping("/my")
    public Result<List<Portfolio>> getMyPortfolio() {
        com.dubbing.entity.User currentUser = com.dubbing.util.UserContext.getCurrentUser();
        List<Portfolio> portfolios = portfolioService.getUserPortfolio(currentUser.getId());
        return Result.success(portfolios);
    }

    @GetMapping("/user/{userId}")
    public Result<List<Portfolio>> getUserPortfolio(@PathVariable Long userId) {
        List<Portfolio> portfolios = portfolioService.getUserPortfolio(userId);
        return Result.success(portfolios);
    }

    @PostMapping("/add")
    public Result<Portfolio> addPortfolio(@RequestParam String title,
                                          @RequestParam(required = false) String description,
                                          @RequestParam("audioFile") MultipartFile audioFile) throws IOException {
        Portfolio portfolio = portfolioService.addPortfolio(title, description, audioFile);
        return Result.success("作品添加成功", portfolio);
    }

    @PostMapping("/update/{id}")
    public Result<Void> updatePortfolio(@PathVariable Long id,
                                        @RequestParam String title,
                                        @RequestParam(required = false) String description) {
        portfolioService.updatePortfolio(id, title, description);
        return Result.success("作品更新成功");
    }

    @PostMapping("/delete/{id}")
    public Result<Void> deletePortfolio(@PathVariable Long id) {
        portfolioService.deletePortfolio(id);
        return Result.success("作品删除成功");
    }
}
