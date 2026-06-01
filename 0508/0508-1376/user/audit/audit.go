package audit

import (
	"github.com/ebpf-net-audit/audit-engine/user/store"
)

type Auditor struct {
	store *store.Store
}

func NewAuditor(st *store.Store) *Auditor {
	return &Auditor{store: st}
}

func (a *Auditor) QueryByProcess(comm string, limit, offset int) ([]store.ConnectionRecord, int64, error) {
	return a.store.QueryConnections(store.QueryFilter{
		Comm:   comm,
		Limit:  limit,
		Offset: offset,
	})
}

func (a *Auditor) QueryByIP(ip string, limit, offset int) ([]store.ConnectionRecord, int64, error) {
	return a.store.QueryConnections(store.QueryFilter{
		DestIP: ip,
		Limit:  limit,
		Offset: offset,
	})
}

func (a *Auditor) QueryByPort(port uint16, limit, offset int) ([]store.ConnectionRecord, int64, error) {
	return a.store.QueryConnections(store.QueryFilter{
		DestPort: port,
		Limit:    limit,
		Offset:   offset,
	})
}

func (a *Auditor) QueryByTimeRange(start, end int64, limit, offset int) ([]store.ConnectionRecord, int64, error) {
	return a.store.QueryConnections(store.QueryFilter{
		Limit:  limit,
		Offset: offset,
	})
}

func (a *Auditor) QueryBlocked(limit, offset int) ([]store.BlockRecord, int64, error) {
	return a.store.QueryBlocked(store.QueryFilter{
		Limit:  limit,
		Offset: offset,
	})
}
