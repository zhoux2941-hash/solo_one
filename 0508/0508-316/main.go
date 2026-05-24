package main

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"sync"
	"time"

	"github.com/quic-go/webtransport-go"
)

const (
	MaxPlayersPerRoom = 8
	RoundTime         = 90
	GuessScore        = 100
	DrawBaseScore     = 50
	DrawBonusPerGuess = 25
)

type Player struct {
	ID       string
	Name     string
	Avatar   string
	Session  *webtransport.Session
	Stream   webtransport.Stream
	RoomID   string
	Score    int
	IsDrawer bool
}

type Room struct {
	ID           string
	Players      map[string]*Player
	Drawer       string
	Word         string
	Words        []string
	RoundTimer   *time.Timer
	Guessed      map[string]bool
	IsGameActive bool
	mu           sync.RWMutex
}

type Message struct {
	Type    string      `json:"type"`
	Data    interface{} `json:"data"`
	From    string      `json:"from,omitempty"`
	RoomID  string      `json:"roomId,omitempty"`
	Player  string      `json:"player,omitempty"`
	Score   int         `json:"score,omitempty"`
	Avatar  string      `json:"avatar,omitempty"`
}

type DrawData struct {
	X         int     `json:"x"`
	Y         int     `json:"y"`
	PrevX     int     `json:"prevX"`
	PrevY     int     `json:"prevY"`
	Color     string  `json:"color"`
	LineWidth float64 `json:"lineWidth"`
	IsEraser  bool    `json:"isEraser"`
}

var (
	rooms   = make(map[string]*Room)
	roomsMu sync.RWMutex
	wordList = uniqueWords([]string{
		"苹果", "香蕉", "橙子", "葡萄", "西瓜", "草莓", "桃子", "梨子",
		"汽车", "飞机", "火车", "自行车", "轮船", "摩托车", "公交车", "出租车",
		"太阳", "月亮", "星星", "云朵", "彩虹", "闪电", "雪花", "雨滴",
		"猫", "狗", "鸟", "鱼", "兔子", "老虎", "狮子", "大象",
		"房子", "学校", "医院", "公园", "商店", "银行", "图书馆", "电影院",
		"足球", "篮球", "排球", "网球", "乒乓球", "羽毛球", "游泳", "跑步",
		"电脑", "手机", "电视", "冰箱", "空调", "洗衣机", "微波炉", "相机",
		"书本", "铅笔", "橡皮", "尺子", "书包", "台灯", "时钟", "眼镜",
		"汉堡", "披萨", "面条", "米饭", "饺子", "蛋糕", "冰淇淋", "巧克力",
		"眼睛", "鼻子", "嘴巴", "耳朵", "手", "脚", "头发", "心脏",
		"雨伞", "帽子", "鞋子", "袜子", "衣服", "裤子", "裙子", "手套",
		"树", "花", "草", "叶子", "森林", "花园", "沙漠", "海洋",
		"山", "河", "湖", "瀑布", "岛屿", "火山", "洞穴", "沙滩",
		"蝴蝶", "蜜蜂", "蚂蚁", "蜗牛", "蜘蛛", "青蛙", "蛇", "乌龟",
		"机器人", "外星人", "飞碟", "火箭", "卫星", "宇航员", "飞船", "空间站",
		"吉他", "钢琴", "小提琴", "鼓", "笛子", "萨克斯", "喇叭", "古筝",
		"国王", "王后", "王子", "公主", "骑士", "巫师", "龙", "城堡",
		"礼物", "气球", "烟花", "蜡烛", "生日", "婚礼", "派对",
		"眼泪", "笑脸", "爱心",
		"桌子", "椅子", "床", "沙发", "柜子", "镜子", "窗户", "门",
		"牙刷", "牙膏", "毛巾", "肥皂", "洗发水", "梳子", "刷子", "杯子",
		"钥匙", "锁", "灯泡", "插座", "开关", "电线", "电池", "充电器",
		"地图", "指南针", "手表", "日历", "照片", "相框", "邮票", "信封",
		"磁铁", "胶水", "剪刀", "胶带", "回形针", "订书机", "文件夹", "笔记本",
		"薯条", "可乐", "咖啡", "茶", "牛奶", "果汁", "啤酒",
		"熊猫", "长颈鹿", "斑马", "袋鼠", "考拉", "狐狸", "熊", "狼",
		"鲸鱼", "鲨鱼", "海豚", "章鱼", "海星", "珊瑚", "贝壳", "海马",
		"钢琴", "小提琴", "吉他", "鼓", "笛子", "古筝", "二胡", "琵琶",
		"书包", "文具盒", "橡皮", "尺子", "铅笔", "钢笔", "圆珠笔", "毛笔",
		"篮球", "足球", "排球", "网球", "羽毛球", "乒乓球", "高尔夫", "橄榄球",
		"冰箱", "空调", "电视", "洗衣机", "微波炉", "烤箱", "电饭煲", "榨汁机",
		"草莓", "蓝莓", "芒果", "猕猴桃", "菠萝", "椰子", "榴莲", "樱桃",
		"荷花", "菊花", "玫瑰", "牡丹", "百合", "向日葵", "郁金香", "兰花",
	})
)

func uniqueWords(words []string) []string {
	seen := make(map[string]bool)
	result := []string{}
	for _, word := range words {
		if !seen[word] {
			seen[word] = true
			result = append(result, word)
		}
	}
	return result
}

func shuffleWords(words []string) []string {
	shuffled := make([]string, len(words))
	copy(shuffled, words)
	for i := range shuffled {
		j := rand.Intn(i + 1)
		shuffled[i], shuffled[j] = shuffled[j], shuffled[i]
	}
	return shuffled
}

func main() {
	rand.Seed(time.Now().UnixNano())

	tlsCert, err := tls.LoadX509KeyPair("cert.pem", "key.pem")
	if err != nil {
		log.Fatal("加载证书失败:", err)
	}

	wtServer := &webtransport.Server{
		TLSConfig: &tls.Config{
			Certificates: []tls.Certificate{tlsCert},
		},
	}

	mux := http.NewServeMux()
	mux.Handle("/", http.FileServer(http.Dir("./static")))
	mux.HandleFunc("/webtransport", func(w http.ResponseWriter, r *http.Request) {
		session, err := wtServer.Upgrade(w, r)
		if err != nil {
			log.Println("升级WebTransport失败:", err)
			return
		}
		go handleSession(session)
	})

	go func() {
		for {
			time.Sleep(10 * time.Second)
			cleanupEmptyRooms()
		}
	}()

	log.Println("服务器启动在 :4433")
	log.Fatal(http.ListenAndServeTLS(":4433", "cert.pem", "key.pem", mux))
}

func handleSession(session *webtransport.Session) {
	defer session.CloseWithError(0, "bye")

	stream, err := session.AcceptStream(context.Background())
	if err != nil {
		log.Println("接受流失败:", err)
		return
	}
	defer stream.Close()

	player := &Player{
		ID:      generateID(),
		Session: session,
		Stream:  stream,
	}

	decoder := json.NewDecoder(stream)
	for {
		var msg Message
		if err := decoder.Decode(&msg); err != nil {
			log.Println("解码消息失败:", err)
			removePlayerFromRoom(player)
			return
		}

		handleMessage(player, &msg)
	}
}

func handleMessage(player *Player, msg *Message) {
	switch msg.Type {
	case "join":
		handleJoin(player, msg)
	case "chat":
		handleChat(player, msg)
	case "draw":
		handleDraw(player, msg)
	case "clearCanvas":
		handleClearCanvas(player)
	case "startGame":
		handleStartGame(player)
	}
}

func handleJoin(player *Player, msg *Message) {
	roomID := msg.RoomID
	if roomID == "" {
		roomID = generateID()
	}

	player.Name = msg.Player
	if player.Name == "" {
		player.Name = "玩家" + player.ID[:4]
	}
	
	player.Avatar = msg.Avatar
	if player.Avatar == "" {
		player.Avatar = "😀"
	}

	roomsMu.Lock()
	room, exists := rooms[roomID]
	if !exists {
		room = &Room{
			ID:          roomID,
			Players:     make(map[string]*Player),
			Guessed:     make(map[string]bool),
			Words:       shuffleWords(append([]string{}, wordList...)),
			IsGameActive: false,
		}
		rooms[roomID] = room
	}
	roomsMu.Unlock()

	room.mu.Lock()
	defer room.mu.Unlock()

	if len(room.Players) >= MaxPlayersPerRoom {
		sendMessage(player, Message{Type: "error", Data: "房间已满"})
		return
	}

	player.RoomID = roomID
	room.Players[player.ID] = player

	playerList := make([]map[string]interface{}, 0)
	for _, p := range room.Players {
		playerList = append(playerList, map[string]interface{}{
			"id":    p.ID,
			"name":  p.Name,
			"avatar": p.Avatar,
			"score": p.Score,
			"isDrawer": p.IsDrawer,
		})
	}

	sendMessage(player, Message{
		Type:   "joined",
		Data:   roomID,
		From:   player.ID,
		Player: player.Name,
	})

	broadcastToRoom(room, Message{
		Type:   "playerJoined",
		Data:   playerList,
		Player: player.Name,
	}, player.ID)
}

func handleChat(player *Player, msg *Message) {
	if player.RoomID == "" {
		return
	}

	roomsMu.RLock()
	room, exists := rooms[player.RoomID]
	roomsMu.RUnlock()

	if !exists {
		return
	}

	room.mu.RLock()
	defer room.mu.RUnlock()

	if room.IsGameActive && !player.IsDrawer && room.Word != "" {
		chatText := fmt.Sprintf("%v", msg.Data)
		if chatText == room.Word {
			if !room.Guessed[player.ID] {
				room.Guessed[player.ID] = true
				player.Score += GuessScore

				sendMessage(player, Message{Type: "correctGuess", Data: room.Word})

				broadcastToRoom(room, Message{
					Type:   "chat",
					Data:   player.Name + " 猜对了！",
					Player: "系统",
				}, "")

				allGuessed := true
				for _, p := range room.Players {
					if !p.IsDrawer && !room.Guessed[p.ID] {
						allGuessed = false
						break
					}
				}

				if allGuessed {
					go func() {
						time.Sleep(2 * time.Second)
						endRound(room)
					}()
				}
			}
			return
		}
	}

	broadcastToRoom(room, Message{
		Type:   "chat",
		Data:   msg.Data,
		Player: player.Name,
		Avatar: player.Avatar,
	}, "")
}

func handleDraw(player *Player, msg *Message) {
	if !player.IsDrawer || player.RoomID == "" {
		return
	}

	roomsMu.RLock()
	room, exists := rooms[player.RoomID]
	roomsMu.RUnlock()

	if !exists {
		return
	}

	broadcastToRoom(room, Message{
		Type: "draw",
		Data: msg.Data,
		From: player.ID,
	}, "")
}

func handleClearCanvas(player *Player) {
	if !player.IsDrawer || player.RoomID == "" {
		return
	}

	roomsMu.RLock()
	room, exists := rooms[player.RoomID]
	roomsMu.RUnlock()

	if !exists {
		return
	}

	broadcastToRoom(room, Message{
		Type: "clearCanvas",
		From: player.ID,
	}, "")
}

func handleStartGame(player *Player) {
	if player.RoomID == "" {
		return
	}

	roomsMu.RLock()
	room, exists := rooms[player.RoomID]
	roomsMu.RUnlock()

	if !exists {
		return
	}

	room.mu.Lock()
	defer room.mu.Unlock()

	if len(room.Players) < 2 {
		sendMessage(player, Message{Type: "error", Data: "至少需要2名玩家才能开始游戏"})
		return
	}

	startNewRound(room)
}

func startNewRound(room *Room) {
	for _, p := range room.Players {
		p.IsDrawer = false
	}

	var drawerCandidates []*Player
	for _, p := range room.Players {
		if p.IsDrawer == false {
			drawerCandidates = append(drawerCandidates, p)
		}
	}

	if len(drawerCandidates) == 0 {
		return
	}

	drawer := drawerCandidates[rand.Intn(len(drawerCandidates))]
	drawer.IsDrawer = true
	room.Drawer = drawer.ID
	room.Guessed = make(map[string]bool)
	room.Guessed[drawer.ID] = true
	room.IsGameActive = true

	if len(room.Words) == 0 {
		room.Words = shuffleWords(append([]string{}, wordList...))
	}

	wordIndex := rand.Intn(len(room.Words))
	room.Word = room.Words[wordIndex]
	room.Words = append(room.Words[:wordIndex], room.Words[wordIndex+1:]...)

	broadcastToRoom(room, Message{
		Type: "clearCanvas",
	}, "")

	for _, p := range room.Players {
		if p.IsDrawer {
			sendMessage(p, Message{
				Type: "yourTurn",
				Data: room.Word,
			})
		} else {
			sendMessage(p, Message{
				Type: "guessTurn",
				Data: len(room.Word),
			})
		}
	}

	playerList := make([]map[string]interface{}, 0)
	for _, p := range room.Players {
		playerList = append(playerList, map[string]interface{}{
			"id":       p.ID,
			"name":     p.Name,
			"avatar":   p.Avatar,
			"score":    p.Score,
			"isDrawer": p.IsDrawer,
		})
	}

	broadcastToRoom(room, Message{
		Type: "playerList",
		Data: playerList,
	}, "")

	if room.RoundTimer != nil {
		room.RoundTimer.Stop()
	}
	room.RoundTimer = time.AfterFunc(RoundTime*time.Second, func() {
		endRound(room)
	})
}

func endRound(room *Room) {
	room.mu.Lock()
	if room.RoundTimer != nil {
		room.RoundTimer.Stop()
		room.RoundTimer = nil
	}
	room.IsGameActive = false

	drawerScore := DrawBaseScore + DrawBonusPerGuess*(len(room.Guessed)-1)
	for _, p := range room.Players {
		if p.IsDrawer {
			p.Score += drawerScore
		}
	}

	word := room.Word
	room.Word = ""

	broadcastToRoom(room, Message{
		Type:  "roundEnd",
		Data:  word,
		Score: drawerScore,
	}, "")

	playerList := make([]map[string]interface{}, 0)
	for _, p := range room.Players {
		playerList = append(playerList, map[string]interface{}{
			"id":       p.ID,
			"name":     p.Name,
			"avatar":   p.Avatar,
			"score":    p.Score,
			"isDrawer": p.IsDrawer,
		})
	}

	broadcastToRoom(room, Message{
		Type: "playerList",
		Data: playerList,
	}, "")

	playerCount := len(room.Players)
	room.mu.Unlock()

	time.Sleep(5 * time.Second)

	room.mu.Lock()
	if playerCount >= 2 && len(room.Players) >= 2 {
		room.mu.Unlock()
		startNewRound(room)
	} else {
		room.mu.Unlock()
	}
}

func removePlayerFromRoom(player *Player) {
	if player.RoomID == "" {
		return
	}

	roomsMu.RLock()
	room, exists := rooms[player.RoomID]
	roomsMu.RUnlock()

	if !exists {
		return
	}

	room.mu.Lock()
	defer room.mu.Unlock()

	delete(room.Players, player.ID)

	broadcastToRoom(room, Message{
		Type:   "playerLeft",
		Player: player.Name,
	}, "")

	if player.IsDrawer && room.RoundTimer != nil {
		room.RoundTimer.Stop()
		room.Word = ""
	}
}

func cleanupEmptyRooms() {
	roomsMu.Lock()
	defer roomsMu.Unlock()

	for id, room := range rooms {
		room.mu.Lock()
		if len(room.Players) == 0 {
			if room.RoundTimer != nil {
				room.RoundTimer.Stop()
			}
			delete(rooms, id)
		}
		room.mu.Unlock()
	}
}

func broadcastToRoom(room *Room, msg Message, excludeID string) {
	room.mu.RLock()
	defer room.mu.RUnlock()

	for _, p := range room.Players {
		if p.ID != excludeID {
			sendMessage(p, msg)
		}
	}
}

func sendMessage(player *Player, msg Message) {
	data, err := json.Marshal(msg)
	if err != nil {
		log.Println("编码消息失败:", err)
		return
	}
	player.Stream.Write(data)
	player.Stream.Write([]byte("\n"))
}

func generateID() string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, 8)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}
