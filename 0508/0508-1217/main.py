import sys
import threading
import queue
from game import IdiomGame


class TimeoutInput:
    def __init__(self, timeout=30):
        self.timeout = timeout
        self.input_queue = queue.Queue()
        self.user_input = None
        self.timed_out = False

    def _target(self):
        try:
            user_input = sys.stdin.readline().strip()
            self.input_queue.put(user_input)
        except Exception:
            pass

    def get_input(self, prompt=""):
        print(prompt, end="", flush=True)
        self.input_queue = queue.Queue()
        input_thread = threading.Thread(target=self._target)
        input_thread.daemon = True
        input_thread.start()
        
        try:
            user_input = self.input_queue.get(timeout=self.timeout)
            return user_input
        except queue.Empty:
            return None


class IdiomGameCLI:
    def __init__(self):
        self.game = None
        self.timeout_input = TimeoutInput(timeout=30)
        self.difficulty = 'medium'

    def print_header(self):
        print("\n" + "="*50)
        print("         成语接龙游戏")
        print("="*50)
        print("规则：下一个成语的首字必须与上一个成语的尾字同音")
        print("特殊命令：")
        print("  ?成语   - 查询成语释义（如：?一心一意）")
        print("  /help   - 显示帮助")
        print("  /quit   - 退出游戏")
        print("  /start  - 开始新游戏")
        print("  /diff   - 切换难度")
        print("="*50 + "\n")

    def print_help(self):
        print("\n" + "-"*40)
        print("游戏帮助：")
        print("1. 输入成语进行接龙")
        print("2. 成语首字需要与上一个成语的尾字同音")
        print("3. 30秒内未输入将超时，换对方继续")
        print("4. 输入 ?成语 可以查询成语释义")
        print("5. 难度说明：")
        print("   简单 - AI只用简单成语")
        print("   中等 - AI用简单和中等成语")
        print("   困难 - AI可用全部成语")
        print("-"*40 + "\n")

    def select_difficulty(self):
        print("\n请选择难度：")
        print("1. 简单")
        print("2. 中等")
        print("3. 困难")
        
        choice = input("请输入选择 (1-3，默认2): ").strip()
        
        if choice == '1':
            self.difficulty = 'easy'
            print("已选择：简单模式")
        elif choice == '3':
            self.difficulty = 'hard'
            print("已选择：困难模式")
        else:
            self.difficulty = 'medium'
            print("已选择：中等模式")

    def query_idiom(self, idiom):
        if not self.game:
            self.game = IdiomGame(self.difficulty)
        result = self.game.query_idiom(idiom)
        if result['found']:
            print("\n" + "-"*40)
            print(f"成语：{result['idiom']}")
            print(f"拼音：{result['pinyin']}")
            print(f"释义：{result['meaning']}")
            print(f"难度：{result['difficulty']}")
            print("-"*40 + "\n")
        else:
            print(f"\n{result['message']}\n")

    def print_game_status(self):
        if not self.game:
            return
        status = self.game.get_game_status()
        print(f"\n[当前接龙长度: {status['chain_length']}] ", end="")
        if status['current_idiom']:
            print(f"[当前成语: {status['current_idiom']['idiom']}] ", end="")
            print(f"[请接: {status['current_idiom']['idiom'][-1]}]")
        print()

    def player_turn(self):
        self.print_game_status()
        
        prompt = "请输入成语 (30秒超时): "
        player_input = self.timeout_input.get_input(prompt)
        
        if player_input is None:
            print("\n⏰ 时间到！30秒未输入，换AI继续。")
            return 'timeout'
        
        player_input = player_input.strip()

        if hasattr(self, '_last_suggestions') and self._last_suggestions:
            if player_input.isdigit():
                idx = int(player_input)
                if 1 <= idx <= len(self._last_suggestions):
                    selected_idiom = self._last_suggestions[idx - 1]['idiom']
                    print(f"🔍 使用推荐成语：{selected_idiom}")
                    self._last_suggestions = None
                    player_input = selected_idiom
                else:
                    print("❌ 序号无效，请重新输入")
                    return 'retry'
            else:
                self._last_suggestions = None

        if not player_input:
            print("请输入有效的成语！")
            return 'retry'
            
        if player_input.startswith('?'):
            idiom_to_query = player_input[1:].strip()
            if idiom_to_query:
                self.query_idiom(idiom_to_query)
            return 'retry'
            
        if player_input == '/help':
            self.print_help()
            return 'retry'
            
        if player_input == '/quit':
            return 'quit'
            
        if player_input == '/start':
            return 'restart'
            
        if player_input == '/diff':
            self.select_difficulty()
            if self.game:
                self.game.set_difficulty(self.difficulty)
            return 'retry'
        
        result = self.game.player_input(player_input)

        if result['success']:
            print(f"✅ {result['message']}")
            print(f"   {result['idiom_info']['idiom']} - {result['idiom_info']['meaning']}")
            return 'success'
        else:
            print(f"❌ {result['message']}")
            if 'suggestions' in result and result['suggestions']:
                print("\n📝 你可以直接输入推荐的成语序号来使用：")
                for idx, s in enumerate(result['suggestions'], 1):
                    print(f"   {idx}. {s['idiom']} - {s['meaning'][:20]}...")
                print("   (输入序号即可快速选择)\n")
                self._last_suggestions = result['suggestions']
                return 'suggestion'
            return 'retry'

    def ai_turn(self):
        print("\n🤖 AI正在思考...", end="", flush=True)
        import time
        time.sleep(1)
        print("\r", end="")
        
        result = self.game.ai_play()
        
        if result['success']:
            print(f"🤖 AI接龙：{result['idiom_info']['idiom']}")
            print(f"   {result['idiom_info']['meaning']}")
            return 'success'
        else:
            print(f"🎉 {result['message']}")
            return 'game_over'

    def start_game(self):
        self.print_header()
        self.select_difficulty()
        
        while True:
            self.game = IdiomGame(self.difficulty)
            
            print("\n🎮 游戏开始！")
            first_choice = input("你想先开始吗？(y/n，默认y): ").strip().lower()
            player_first = first_choice != 'n'
            
            start_idiom = self.game.start_game(player_first=player_first)
            
            if not player_first and start_idiom:
                print(f"🤖 AI开头：{start_idiom['idiom']}")
                print(f"   {start_idiom['meaning']}")
            
            game_active = True
            while game_active:
                if self.game.is_player_turn:
                    while True:
                        p_result = self.player_turn()
                        if p_result == 'success':
                            break
                        elif p_result == 'timeout':
                            print("由于超时，AI获得机会继续...")
                            self.game.is_player_turn = False
                            if not self.game.current_idiom:
                                print("游戏刚开始，请重新输入成语。")
                                self.game.is_player_turn = True
                                continue
                            break
                        elif p_result == 'suggestion':
                            continue
                        elif p_result == 'quit':
                            print("\n👋 感谢游玩！再见！")
                            return
                        elif p_result == 'restart':
                            game_active = False
                            break
                        elif p_result == 'retry':
                            continue
                    
                    if not game_active or p_result == 'quit':
                        break
                    
                    if p_result == 'timeout':
                        pass
                else:
                    ai_result = self.ai_turn()
                    if ai_result == 'game_over':
                        game_active = False
                        break
                
                if self.game.game_over:
                    game_active = False
                    break
            
            if self.game.game_over:
                print(f"\n🏆 游戏结束！最终接龙长度：{self.game.chain_length}")
            else:
                print(f"\n📊 当前接龙长度：{self.game.chain_length}")
            
            play_again = input("\n再玩一局吗？(y/n，默认y): ").strip().lower()
            if play_again == 'n':
                print("\n👋 感谢游玩！再见！")
                break


def main():
    try:
        cli = IdiomGameCLI()
        cli.start_game()
    except KeyboardInterrupt:
        print("\n\n👋 游戏已退出，再见！")
    except Exception as e:
        print(f"\n❌ 发生错误：{e}")
        print("请确保已安装依赖：pip install pypinyin")


if __name__ == "__main__":
    main()
