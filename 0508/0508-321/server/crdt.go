package server

import (
	"encoding/json"
	"sort"
	"sync"
	"time"
)

type OperationType string

const (
	OpSetValue     OperationType = "set_value"
	OpSetFormat    OperationType = "set_format"
	OpSetColumnWidth OperationType = "set_column_width"
	OpSetRowHeight OperationType = "set_row_height"
)

type Operation struct {
	ID        string        `json:"id"`
	Type      OperationType `json:"type"`
	CellID    string        `json:"cell_id"`
	Value     interface{}   `json:"value"`
	Format    *CellFormat   `json:"format,omitempty"`
	Timestamp int64         `json:"timestamp"`
	ClientID  string        `json:"client_id"`
}

type CellFormat struct {
	Bold      bool   `json:"bold"`
	Italic    bool   `json:"italic"`
	BgColor   string `json:"bg_color"`
}

type CellState struct {
	Value     interface{} `json:"value"`
	Format    CellFormat  `json:"format"`
	Timestamp int64       `json:"timestamp"`
	ClientID  string      `json:"client_id"`
}

type CRDTDocument struct {
	mu           sync.RWMutex
	operations   map[string]Operation
	cellStates   map[string]CellState
	columnWidths map[string]int
	rowHeights   map[int]int
}

func NewCRDTDocument() *CRDTDocument {
	return &CRDTDocument{
		operations:   make(map[string]Operation),
		cellStates:   make(map[string]CellState),
		columnWidths: make(map[string]int),
		rowHeights:   make(map[int]int),
	}
}

func (d *CRDTDocument) ApplyOperation(op Operation) bool {
	d.mu.Lock()
	defer d.mu.Unlock()

	if _, exists := d.operations[op.ID]; exists {
		return false
	}

	d.operations[op.ID] = op

	switch op.Type {
	case OpSetValue, OpSetFormat:
		current, exists := d.cellStates[op.CellID]
		if !exists || op.Timestamp > current.Timestamp {
			if op.Type == OpSetValue {
				current.Value = op.Value
			}
			if op.Type == OpSetFormat && op.Format != nil {
				current.Format = *op.Format
			}
			current.Timestamp = op.Timestamp
			current.ClientID = op.ClientID
			d.cellStates[op.CellID] = current
		}
	case OpSetColumnWidth:
		if width, ok := op.Value.(float64); ok {
			d.columnWidths[op.CellID] = int(width)
		}
	case OpSetRowHeight:
		if height, ok := op.Value.(float64); ok {
			rowNum := int(op.Value.(float64))
			d.rowHeights[rowNum] = int(height)
		}
	}

	return true
}

func (d *CRDTDocument) GetState() map[string]interface{} {
	d.mu.RLock()
	defer d.mu.RUnlock()

	state := make(map[string]interface{})
	cells := make(map[string]CellState)
	for k, v := range d.cellStates {
		cells[k] = v
	}
	state["cells"] = cells
	state["column_widths"] = d.columnWidths
	state["row_heights"] = d.rowHeights
	return state
}

func (d *CRDTDocument) GetOperationsSince(timestamp int64) []Operation {
	d.mu.RLock()
	defer d.mu.RUnlock()

	var ops []Operation
	for _, op := range d.operations {
		if op.Timestamp > timestamp {
			ops = append(ops, op)
		}
	}
	sort.Slice(ops, func(i, j int) bool {
		return ops[i].Timestamp < ops[j].Timestamp
	})
	return ops
}

func GenerateOpID() string {
	return time.Now().Format("20060102150405.000000000")
}

func (op *Operation) ToJSON() ([]byte, error) {
	return json.Marshal(op)
}

func OperationFromJSON(data []byte) (Operation, error) {
	var op Operation
	err := json.Unmarshal(data, &op)
	return op, err
}
