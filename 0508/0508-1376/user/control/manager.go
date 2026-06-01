package control

import (
	"encoding/binary"
	"fmt"
	"log"
	"net"
	"strings"
	"sync"

	bpfpb "github.com/ebpf-net-audit/audit-engine/user/bpf"
	"github.com/ebpf-net-audit/audit-engine/user/store"
)

type RuleManager struct {
	bpf   *bpfpb.BPFManager
	store *store.Store
	mu    sync.Mutex
}

type RuleCreateRequest struct {
	Type     uint8  `json:"type"`
	Action   uint8  `json:"action"`
	Comm     string `json:"comm"`
	IP       string `json:"ip"`
	CIDR     string `json:"cidr"`
	Port     uint16 `json:"port"`
	Protocol uint8  `json:"protocol"`
	Domain   string `json:"domain"`
}

func NewRuleManager(bpf *bpfpb.BPFManager, st *store.Store) *RuleManager {
	return &RuleManager{
		bpf:   bpf,
		store: st,
	}
}

func (m *RuleManager) AddRule(req *RuleCreateRequest) (uint32, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	ruleRec := &store.RuleRecord{
		Type:     req.Type,
		Action:   req.Action,
		Enabled:  true,
		Comm:     req.Comm,
		IP:       req.IP,
		Port:     req.Port,
		Protocol: req.Protocol,
		Domain:   req.Domain,
	}

	id, err := m.store.InsertRule(ruleRec)
	if err != nil {
		return 0, fmt.Errorf("insert rule: %w", err)
	}

	if err := m.addRuleToBPF(id, req); err != nil {
		m.store.DeleteRule(id)
		return 0, fmt.Errorf("add rule to bpf: %w", err)
	}

	return id, nil
}

func (m *RuleManager) addRuleToBPF(id uint32, req *RuleCreateRequest) error {
	switch req.Type {
	case bpfpb.RULE_PROCESS_IP_BLOCK:
		return m.addProcessIPBlockRule(id, req)
	case bpfpb.RULE_IP_BLOCK:
		return m.addIPBlockRule(id, req)
	case bpfpb.RULE_DOMAIN_BLOCK:
		return m.addDomainBlockRule(id, req)
	case bpfpb.RULE_PORT_BLOCK:
		return m.addPortBlockRule(id, req)
	case bpfpb.RULE_PROCESS_PORT_ALLOW:
		return m.addProcessPortBlockRule(id, req)
	default:
		return fmt.Errorf("unknown rule type: %d", req.Type)
	}
}

func (m *RuleManager) addProcessIPBlockRule(id uint32, req *RuleCreateRequest) error {
	var ip, mask uint32
	var err error

	if req.CIDR != "" {
		ip, mask, err = parseCIDR(req.CIDR)
		if err != nil {
			return fmt.Errorf("parse CIDR: %w", err)
		}
	} else if req.IP != "" {
		ip, err = ipToUint32(req.IP)
		if err != nil {
			return fmt.Errorf("parse IP: %w", err)
		}
		mask = 0xFFFFFFFF
	} else {
		return fmt.Errorf("IP or CIDR required for process IP block rule")
	}

	lpmKey := bpfpb.MakeLpmIPKey(ip, mask)
	value := &bpfpb.LpmIPValue{
		ID:       id,
		Action:   bpfpb.ACTION_DENY,
		Enabled:  1,
		RuleType: bpfpb.RULE_PROCESS_IP_BLOCK,
	}
	if req.Comm != "" {
		copy(value.Comm[:], req.Comm)
	}

	return m.bpf.AddIPBlockRule(&lpmKey, value)
}

func (m *RuleManager) addIPBlockRule(id uint32, req *RuleCreateRequest) error {
	var ip, mask uint32
	var err error

	if req.CIDR != "" {
		ip, mask, err = parseCIDR(req.CIDR)
		if err != nil {
			return fmt.Errorf("parse CIDR: %w", err)
		}
	} else if req.IP != "" {
		ip, err = ipToUint32(req.IP)
		if err != nil {
			return fmt.Errorf("parse IP: %w", err)
		}
		mask = 0xFFFFFFFF
	} else {
		return fmt.Errorf("IP or CIDR required for IP block rule")
	}

	lpmKey := bpfpb.MakeLpmIPKey(ip, mask)
	value := &bpfpb.LpmIPValue{
		ID:       id,
		Action:   bpfpb.ACTION_DENY,
		Enabled:  1,
		RuleType: bpfpb.RULE_IP_BLOCK,
	}

	return m.bpf.AddIPBlockRule(&lpmKey, value)
}

func (m *RuleManager) addDomainBlockRule(id uint32, req *RuleCreateRequest) error {
	if req.Domain == "" {
		return fmt.Errorf("domain required for domain block rule")
	}

	ips, err := resolveDomain(req.Domain)
	if err != nil {
		log.Printf("Warning: Could not resolve domain %s: %v, rule will be active when DNS is resolved", req.Domain, err)
		return nil
	}

	value := &bpfpb.LpmIPValue{
		ID:       id,
		Action:   bpfpb.ACTION_DENY,
		Enabled:  1,
		RuleType: bpfpb.RULE_DOMAIN_BLOCK,
	}

	for _, ipAddr := range ips {
		ipv4 := ipAddr.To4()
		if ipv4 == nil {
			continue
		}
		ipUint := binary.BigEndian.Uint32(ipv4)
		lpmKey := bpfpb.MakeLpmIPKeyHost(ipUint)
		if err := m.bpf.AddDomainBlockIP(&lpmKey, value); err != nil {
			log.Printf("Add domain block IP %s error: %v", ipAddr, err)
		} else {
			log.Printf("Blocked domain %s resolved IP %s in LPM Trie", req.Domain, ipAddr)
		}
	}

	return nil
}

func (m *RuleManager) addPortBlockRule(id uint32, req *RuleCreateRequest) error {
	key := &bpfpb.PortRuleKey{
		Port:     htons(req.Port),
		Protocol: req.Protocol,
	}
	value := &bpfpb.PortRuleValue{
		ID:      id,
		Action:  bpfpb.ACTION_DENY,
		Enabled: 1,
	}
	if req.Comm != "" {
		copy(value.Comm[:], req.Comm)
	}

	return m.bpf.AddPortBlockRule(key, value)
}

func (m *RuleManager) addProcessPortBlockRule(id uint32, req *RuleCreateRequest) error {
	key := &bpfpb.PortRuleKey{
		Port:     htons(req.Port),
		Protocol: req.Protocol,
	}
	value := &bpfpb.PortRuleValue{
		ID:      id,
		Action:  bpfpb.ACTION_DENY,
		Enabled: 1,
	}
	if req.Comm != "" {
		copy(value.Comm[:], req.Comm)
	}

	return m.bpf.AddPortBlockRule(key, value)
}

func (m *RuleManager) RemoveRule(id uint32) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	rules, err := m.store.ListRules()
	if err != nil {
		return fmt.Errorf("list rules: %w", err)
	}

	var target *store.RuleRecord
	for _, r := range rules {
		if r.ID == id {
			r := r
			target = &r
			break
		}
	}

	if target == nil {
		return fmt.Errorf("rule not found: %d", id)
	}

	if err := m.removeRuleFromBPF(target); err != nil {
		log.Printf("Warning: Failed to remove rule from BPF: %v", err)
	}

	return m.store.DeleteRule(id)
}

func (m *RuleManager) removeRuleFromBPF(rule *store.RuleRecord) error {
	switch rule.Type {
	case bpfpb.RULE_PROCESS_IP_BLOCK, bpfpb.RULE_IP_BLOCK:
		return m.removeIPBlockRule(rule)
	case bpfpb.RULE_DOMAIN_BLOCK:
		return m.removeDomainBlockRule(rule)
	case bpfpb.RULE_PORT_BLOCK, bpfpb.RULE_PROCESS_PORT_ALLOW:
		return m.removePortBlockRule(rule)
	default:
		return fmt.Errorf("unknown rule type: %d", rule.Type)
	}
}

func (m *RuleManager) removeIPBlockRule(rule *store.RuleRecord) error {
	var ip, mask uint32
	var err error

	if rule.IP != "" {
		if strings.Contains(rule.IP, "/") {
			ip, mask, err = parseCIDR(rule.IP)
		} else {
			ip, err = ipToUint32(rule.IP)
			mask = 0xFFFFFFFF
		}
		if err != nil {
			return err
		}
	} else {
		return fmt.Errorf("no IP in rule")
	}

	lpmKey := bpfpb.MakeLpmIPKey(ip, mask)
	return m.bpf.RemoveIPBlockRule(&lpmKey)
}

func (m *RuleManager) removeDomainBlockRule(rule *store.RuleRecord) error {
	if rule.Domain == "" {
		return fmt.Errorf("no domain in rule")
	}

	ips, err := resolveDomain(rule.Domain)
	if err != nil {
		return fmt.Errorf("resolve domain: %w", err)
	}

	for _, ipAddr := range ips {
		ipv4 := ipAddr.To4()
		if ipv4 == nil {
			continue
		}
		ipUint := binary.BigEndian.Uint32(ipv4)
		lpmKey := bpfpb.MakeLpmIPKeyHost(ipUint)
		m.bpf.RemoveDomainBlockIP(&lpmKey)
	}

	return nil
}

func (m *RuleManager) removePortBlockRule(rule *store.RuleRecord) error {
	key := &bpfpb.PortRuleKey{
		Port:     htons(rule.Port),
		Protocol: rule.Protocol,
	}
	return m.bpf.RemovePortBlockRule(key)
}

func (m *RuleManager) ListRules() ([]store.RuleRecord, error) {
	return m.store.ListRules()
}

func (m *RuleManager) AddProcessIPBlock(comm string, cidr string) (uint32, error) {
	return m.AddRule(&RuleCreateRequest{
		Type:   bpfpb.RULE_PROCESS_IP_BLOCK,
		Action: bpfpb.ACTION_DENY,
		Comm:   comm,
		CIDR:   cidr,
	})
}

func (m *RuleManager) AddProcessPortAllow(comm string, protocol uint8, allowedPorts []uint16) ([]uint32, error) {
	var ids []uint32
	for port := uint16(1); port <= 65535; port++ {
		allowed := false
		for _, p := range allowedPorts {
			if p == port {
				allowed = true
				break
			}
		}
		if !allowed {
			id, err := m.AddRule(&RuleCreateRequest{
				Type:     bpfpb.RULE_PROCESS_PORT_ALLOW,
				Action:   bpfpb.ACTION_DENY,
				Comm:     comm,
				Port:     port,
				Protocol: protocol,
			})
			if err != nil {
				return ids, err
			}
			ids = append(ids, id)
		}
	}
	return ids, nil
}

func (m *RuleManager) AddDomainBlock(domain string) (uint32, error) {
	return m.AddRule(&RuleCreateRequest{
		Type:   bpfpb.RULE_DOMAIN_BLOCK,
		Action: bpfpb.ACTION_DENY,
		Domain: domain,
	})
}

func (m *RuleManager) AddIPBlock(cidr string) (uint32, error) {
	return m.AddRule(&RuleCreateRequest{
		Type:   bpfpb.RULE_IP_BLOCK,
		Action: bpfpb.ACTION_DENY,
		CIDR:   cidr,
	})
}

func (m *RuleManager) RefreshDomainRules() error {
	m.mu.Lock()
	defer m.mu.Unlock()

	rules, err := m.store.ListRules()
	if err != nil {
		return fmt.Errorf("list rules: %w", err)
	}

	for _, rule := range rules {
		if rule.Type != bpfpb.RULE_DOMAIN_BLOCK || !rule.Enabled {
			continue
		}
		if rule.Domain == "" {
			continue
		}

		ips, err := resolveDomain(rule.Domain)
		if err != nil {
			log.Printf("Refresh domain %s resolve error: %v", rule.Domain, err)
			continue
		}

		value := &bpfpb.LpmIPValue{
			ID:       rule.ID,
			Action:   rule.Action,
			Enabled:  1,
			RuleType: bpfpb.RULE_DOMAIN_BLOCK,
		}

		for _, ipAddr := range ips {
			ipv4 := ipAddr.To4()
			if ipv4 == nil {
				continue
			}
			ipUint := binary.BigEndian.Uint32(ipv4)
			lpmKey := bpfpb.MakeLpmIPKeyHost(ipUint)
			if err := m.bpf.AddDomainBlockIP(&lpmKey, value); err != nil {
				log.Printf("Refresh domain %s IP %s update error: %v", rule.Domain, ipAddr, err)
			}
		}
		log.Printf("Refreshed domain rule %s: %d IPs resolved", rule.Domain, len(ips))
	}

	return nil
}

func matchesDomain(query, rule string) bool {
	if query == rule {
		return true
	}
	if strings.HasSuffix(query, "."+rule) {
		return true
	}
	if strings.HasSuffix(rule, "."+query) {
		return true
	}
	return false
}

func (m *RuleManager) LoadRulesFromDB() error {
	m.mu.Lock()
	defer m.mu.Unlock()

	rules, err := m.store.ListRules()
	if err != nil {
		return fmt.Errorf("list rules: %w", err)
	}

	for _, rule := range rules {
		if !rule.Enabled {
			continue
		}

		req := &RuleCreateRequest{
			Type:     rule.Type,
			Action:   rule.Action,
			Comm:     rule.Comm,
			IP:       rule.IP,
			Port:     rule.Port,
			Protocol: rule.Protocol,
			Domain:   rule.Domain,
		}

		if rule.IP != "" && strings.Contains(rule.IP, "/") {
			req.CIDR = rule.IP
		}

		if err := m.addRuleToBPF(rule.ID, req); err != nil {
			log.Printf("Warning: Failed to load rule %d from DB: %v", rule.ID, err)
		} else {
			log.Printf("Loaded rule %d (type=%d) from DB into BPF", rule.ID, rule.Type)
		}
	}

	return nil
}

func parseCIDR(cidr string) (uint32, uint32, error) {
	_, ipnet, err := net.ParseCIDR(cidr)
	if err != nil {
		ip := net.ParseIP(cidr)
		if ip == nil {
			return 0, 0, fmt.Errorf("invalid CIDR/IP: %s", cidr)
		}
		ipv4 := ip.To4()
		if ipv4 == nil {
			return 0, 0, fmt.Errorf("not IPv4: %s", cidr)
		}
		return binary.BigEndian.Uint32(ipv4), 0xFFFFFFFF, nil
	}

	ip := ipnet.IP.To4()
	if ip == nil {
		return 0, 0, fmt.Errorf("not IPv4: %s", cidr)
	}

	mask := binary.BigEndian.Uint32(ipnet.Mask)
	return binary.BigEndian.Uint32(ip), mask, nil
}

func ipToUint32(ipStr string) (uint32, error) {
	ip := net.ParseIP(ipStr)
	if ip == nil {
		return 0, fmt.Errorf("invalid IP: %s", ipStr)
	}
	ipv4 := ip.To4()
	if ipv4 == nil {
		return 0, fmt.Errorf("not IPv4: %s", ipStr)
	}
	return binary.BigEndian.Uint32(ipv4), nil
}

func htons(port uint16) uint16 {
	return (port >> 8) | (port << 8)
}

func resolveDomain(domain string) ([]net.IP, error) {
	return net.LookupIP(domain)
}
