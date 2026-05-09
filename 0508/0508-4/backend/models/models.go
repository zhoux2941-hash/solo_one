package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID        uint       `gorm:"primary_key" json:"id"`
	Username  string     `gorm:"unique_index;not null" json:"username"`
	Email     string     `gorm:"unique_index" json:"email,omitempty"`
	Password  string     `gorm:"not null" json:"-"`
	CreatedAt time.Time  `json:"createdAt"`
	UpdatedAt time.Time  `json:"-"`
	Groups    []WatchlistGroup `gorm:"foreignkey:UserID" json:"-"`
	Alerts    []PriceAlert     `gorm:"foreignkey:UserID" json:"-"`
}

func (u *User) HashPassword(password string) error {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	if err != nil {
		return err
	}
	u.Password = string(bytes)
	return nil
}

func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
	return err == nil
}

type WatchlistGroup struct {
	ID        uint       `gorm:"primary_key" json:"id"`
	Name      string     `gorm:"not null" json:"name"`
	UserID    uint       `gorm:"not null;index" json:"userId"`
	Stocks    []Stock    `gorm:"many2many:group_stocks;" json:"stocks"`
	CreatedAt time.Time  `json:"createdAt"`
	UpdatedAt time.Time  `json:"-"`
}

type Stock struct {
	ID         uint       `gorm:"primary_key" json:"id"`
	Code       string     `gorm:"unique_index;not null" json:"code"`
	Name       string     `gorm:"not null" json:"name"`
	Market     string     `gorm:"not null;index" json:"market"`
	Price      float64    `json:"price"`
	Change     float64    `json:"change"`
	ChangePercent float64 `json:"changePercent"`
	Open       float64    `json:"open"`
	High       float64    `json:"high"`
	Low        float64    `json:"low"`
	Close      float64    `json:"close"`
	Volume     int64      `json:"volume"`
	Amount     float64    `json:"amount"`
	TurnoverRate *float64 `json:"turnoverRate,omitempty"`
	PE         *float64   `json:"pe,omitempty"`
	PB         *float64   `json:"pb,omitempty"`
	UpdatedAt  time.Time  `json:"-"`
}

type KLineData struct {
	ID        uint      `gorm:"primary_key" json:"id"`
	StockID   uint      `gorm:"not null;index:idx_stock_time,unique" json:"-"`
	Code      string    `gorm:"index" json:"code"`
	Time      time.Time `gorm:"index:idx_stock_time,unique" json:"time"`
	Open      float64   `json:"open"`
	Close     float64   `json:"close"`
	High      float64   `json:"high"`
	Low       float64   `json:"low"`
	Volume    int64     `json:"volume"`
	Amount    float64   `json:"amount,omitempty"`
	Type      string    `gorm:"type:varchar(10);index" json:"type"`
}

type TimeLineData struct {
	ID         uint      `gorm:"primary_key"`
	StockID    uint      `gorm:"not null;index"`
	Code       string    `gorm:"index"`
	Time       time.Time `gorm:"index"`
	Price      float64
	AvgPrice   float64
	Volume     int64
	Amount     float64
	PreClose   float64
}

type PriceAlert struct {
	ID          uint      `gorm:"primary_key" json:"id"`
	UserID      uint      `gorm:"not null;index" json:"userId"`
	StockCode   string    `gorm:"not null;index" json:"stockCode"`
	StockName   string    `gorm:"not null" json:"stockName"`
	TargetPrice float64   `gorm:"not null" json:"targetPrice"`
	Type        string    `gorm:"type:varchar(10);not null" json:"type"`
	IsTriggered bool     `gorm:"default:false" json:"isTriggered"`
	TriggeredAt *time.Time `json:"triggeredAt,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"-"`
}

type GroupStock struct {
	GroupID uint `gorm:"primary_key;auto_increment:false"`
	StockID uint `gorm:"primary_key;auto_increment:false"`
}

type FilterCondition struct {
	Field    string  `json:"field"`
	Operator string  `json:"operator"`
	Value    float64 `json:"value"`
	Value2   float64 `json:"value2,omitempty"`
}

type ScreenStrategy struct {
	ID          uint              `gorm:"primary_key" json:"id"`
	UserID      uint              `gorm:"not null;index" json:"userId"`
	Name        string            `gorm:"not null" json:"name"`
	Description string            `json:"description,omitempty"`
	Conditions  string            `gorm:"type:text;not null" json:"-"`
	ConditionsArr []FilterCondition `gorm:"-" json:"conditions"`
	IsDefault   bool              `gorm:"default:false" json:"isDefault"`
	CreatedAt   time.Time         `json:"createdAt"`
	UpdatedAt   time.Time         `json:"-"`
}

type ScreenResult struct {
	Stock      Stock   `json:"stock"`
	MatchScore float64 `json:"matchScore"`
	Matched    []string `json:"matchedConditions"`
}

const (
	OP_GT  = "gt"
	OP_GTE = "gte"
	OP_LT  = "lt"
	OP_LTE = "lte"
	OP_EQ  = "eq"
	OP_BETWEEN = "between"
	
	FIELD_PE           = "pe"
	FIELD_PB           = "pb"
	FIELD_CHANGE       = "change"
	FIELD_CHANGE_PERCENT = "changePercent"
	FIELD_PRICE        = "price"
	FIELD_VOLUME       = "volume"
	FIELD_AMOUNT       = "amount"
	FIELD_TURNOVER     = "turnoverRate"
	FIELD_MARKET_CAP   = "marketCap"
)

var ValidFields = []string{
	FIELD_PE, FIELD_PB, FIELD_CHANGE, FIELD_CHANGE_PERCENT,
	FIELD_PRICE, FIELD_VOLUME, FIELD_AMOUNT, FIELD_TURNOVER, FIELD_MARKET_CAP,
}

var ValidOperators = []string{
	OP_GT, OP_GTE, OP_LT, OP_LTE, OP_EQ, OP_BETWEEN,
}

var FieldLabels = map[string]string{
	FIELD_PE:           "市盈率(PE)",
	FIELD_PB:           "市净率(PB)",
	FIELD_CHANGE:       "涨跌额",
	FIELD_CHANGE_PERCENT: "涨跌幅(%)",
	FIELD_PRICE:        "价格",
	FIELD_VOLUME:       "成交量",
	FIELD_AMOUNT:       "成交额",
	FIELD_TURNOVER:     "换手率(%)",
	FIELD_MARKET_CAP:   "市值",
}

var OperatorLabels = map[string]string{
	OP_GT:      "大于",
	OP_GTE:     "大于等于",
	OP_LT:      "小于",
	OP_LTE:     "小于等于",
	OP_EQ:      "等于",
	OP_BETWEEN: "介于",
}

var FieldUnits = map[string]string{
	FIELD_PE:           "倍",
	FIELD_PB:           "倍",
	FIELD_CHANGE:       "元",
	FIELD_CHANGE_PERCENT: "%",
	FIELD_PRICE:        "元",
	FIELD_VOLUME:       "万股",
	FIELD_AMOUNT:       "万元",
	FIELD_TURNOVER:     "%",
	FIELD_MARKET_CAP:   "亿元",
}
