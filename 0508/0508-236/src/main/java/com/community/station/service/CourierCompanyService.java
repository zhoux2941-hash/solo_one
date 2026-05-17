package com.community.station.service;

import com.community.station.entity.CourierCompany;
import com.community.station.repository.CourierCompanyRepository;
import com.community.station.util.PhoneUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Optional;

@Service
public class CourierCompanyService {

    @Autowired
    private CourierCompanyRepository courierCompanyRepository;

    public List<CourierCompany> getAllCourierCompanies() {
        return courierCompanyRepository.findAll();
    }

    public Page<CourierCompany> getCourierCompaniesByPage(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        return courierCompanyRepository.findAll(pageable);
    }

    public Optional<CourierCompany> getCourierCompanyById(Long id) {
        return courierCompanyRepository.findById(id);
    }

    public Optional<CourierCompany> getCourierCompanyByCode(String companyCode) {
        return courierCompanyRepository.findByCompanyCode(companyCode);
    }

    public CourierCompany createCourierCompany(CourierCompany courierCompany) {
        if (courierCompanyRepository.existsByCompanyCode(courierCompany.getCompanyCode())) {
            throw new RuntimeException("快递公司编码已存在");
        }
        if (StringUtils.hasText(courierCompany.getContactPhone())) {
            if (!PhoneUtils.isValidPhone(courierCompany.getContactPhone())) {
                throw new RuntimeException("电话格式不正确，请输入手机号或固定电话");
            }
            courierCompany.setContactPhone(PhoneUtils.cleanPhone(courierCompany.getContactPhone()));
        }
        return courierCompanyRepository.save(courierCompany);
    }

    public CourierCompany updateCourierCompany(Long id, CourierCompany courierCompanyDetails) {
        CourierCompany courierCompany = courierCompanyRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("快递公司不存在"));

        courierCompany.setCompanyName(courierCompanyDetails.getCompanyName());
        
        if (!courierCompany.getCompanyCode().equals(courierCompanyDetails.getCompanyCode())) {
            if (courierCompanyRepository.existsByCompanyCode(courierCompanyDetails.getCompanyCode())) {
                throw new RuntimeException("快递公司编码已存在");
            }
            courierCompany.setCompanyCode(courierCompanyDetails.getCompanyCode());
        }
        
        courierCompany.setContactPerson(courierCompanyDetails.getContactPerson());
        
        if (StringUtils.hasText(courierCompanyDetails.getContactPhone())) {
            if (!PhoneUtils.isValidPhone(courierCompanyDetails.getContactPhone())) {
                throw new RuntimeException("电话格式不正确，请输入手机号或固定电话");
            }
            courierCompany.setContactPhone(PhoneUtils.cleanPhone(courierCompanyDetails.getContactPhone()));
        } else {
            courierCompany.setContactPhone(null);
        }
        
        courierCompany.setApiUrl(courierCompanyDetails.getApiUrl());
        courierCompany.setApiKey(courierCompanyDetails.getApiKey());
        courierCompany.setApiSecret(courierCompanyDetails.getApiSecret());
        courierCompany.setDeliveryRules(courierCompanyDetails.getDeliveryRules());
        courierCompany.setServiceArea(courierCompanyDetails.getServiceArea());
        courierCompany.setSettlementMethod(courierCompanyDetails.getSettlementMethod());
        courierCompany.setEnabled(courierCompanyDetails.getEnabled());
        courierCompany.setRemark(courierCompanyDetails.getRemark());

        return courierCompanyRepository.save(courierCompany);
    }

    public void deleteCourierCompany(Long id) {
        courierCompanyRepository.deleteById(id);
    }

    public CourierCompany toggleCourierCompanyStatus(Long id) {
        CourierCompany courierCompany = courierCompanyRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("快递公司不存在"));
        courierCompany.setEnabled(!courierCompany.getEnabled());
        return courierCompanyRepository.save(courierCompany);
    }
}
