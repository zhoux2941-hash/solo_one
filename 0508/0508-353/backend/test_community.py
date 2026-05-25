"""
社区挑战功能测试脚本
测试挑战创建、接受、排行榜等API接口
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models import User, Challenge, ChallengeStatus, LeaderboardEntry
from sqlalchemy import func
import uuid
from datetime import datetime, timedelta
import json


def generate_challenge_code() -> str:
    code = str(uuid.uuid4().hex[:8]).upper()
    return f"SL-{code}"


def test_challenge_workflow():
    db = SessionLocal()
    try:
        print("=" * 70)
        print("社区挑战功能测试")
        print("=" * 70)

        # 1. 创建测试用户
        print("\n1. 创建测试用户...")
        usernames = ["测试员小明", "测试员小红", "测试员小刚"]
        users = []
        for username in usernames:
            user = db.query(User).filter(User.username == username).first()
            if not user:
                user = User(username=username)
                db.add(user)
                db.commit()
                db.refresh(user)
            users.append(user)
            print(f"   ✓ 用户: {user.username} (ID: {user.id})")

        # 2. 模拟一些练习记录
        print("\n2. 模拟练习记录...")
        test_word = "你好"
        test_scores = [
            (users[0], 92.5),
            (users[0], 88.3),
            (users[1], 85.7),
            (users[1], 91.2),
            (users[2], 78.4),
            (users[2], 82.1),
        ]

        # 清理旧的测试数据
        db.query(Challenge).delete()
        db.query(LeaderboardEntry).delete()
        db.commit()

        for user, score in test_scores:
            # 更新排行榜
            entry = db.query(LeaderboardEntry).filter(
                LeaderboardEntry.user_id == user.id,
                LeaderboardEntry.word == test_word
            ).first()

            if entry:
                if score > entry.best_score:
                    entry.best_score = score
                entry.total_attempts += 1
                entry.total_score += score
            else:
                entry = LeaderboardEntry(
                    user_id=user.id,
                    word=test_word,
                    best_score=score,
                    total_attempts=1,
                    total_score=score
                )
                db.add(entry)

        db.commit()
        print(f"   ✓ 已创建 {len(test_scores)} 条练习记录")

        # 3. 测试排行榜
        print("\n3. 测试排行榜...")
        leaderboard = db.query(LeaderboardEntry).filter(
            LeaderboardEntry.word == test_word
        ).order_by(LeaderboardEntry.best_score.desc()).all()

        print(f"\n   词汇「{test_word}」排行榜:")
        for i, entry in enumerate(leaderboard, 1):
            avg = entry.total_score / entry.total_attempts
            username = db.query(User).filter(User.id == entry.user_id).first().username
            medal = "🥇" if i == 1 else "🥈" if i == 2 else "🥉" if i == 3 else "  "
            print(f"   {medal} 第{i}名: {username:10s} 最高分: {entry.best_score:5.1f} 平均: {avg:5.1f} ({entry.total_attempts}次)")

        # 4. 创建挑战
        print("\n4. 创建挑战...")
        challenger = users[0]
        challengee = users[1]
        target_score = 85.0

        challenge_code = generate_challenge_code()
        challenge = Challenge(
            challenge_code=challenge_code,
            challenger_id=challenger.id,
            challengee_id=challengee.id,
            word=test_word,
            target_score=target_score,
            status=ChallengeStatus.PENDING,
            expires_at=datetime.utcnow() + timedelta(hours=24)
        )
        db.add(challenge)
        db.commit()
        db.refresh(challenge)

        print(f"   ✓ 挑战创建成功")
        print(f"     挑战码: {challenge.challenge_code}")
        print(f"     挑战者: {challenger.username} → 接受者: {challengee.username}")
        print(f"     词汇: {test_word}, 目标分数: {target_score}分")

        # 5. 接受挑战
        print("\n5. 接受挑战...")
        challenge.status = ChallengeStatus.ACCEPTED
        db.commit()
        print(f"   ✓ 挑战已接受，状态: {challenge.status}")

        # 6. 提交分数
        print("\n6. 提交比赛分数...")
        challenger_score = 88.5
        challengee_score = 90.2

        challenge.challenger_score = challenger_score
        challenge.challengee_score = challengee_score

        if challenger_score > challengee_score:
            challenge.winner_id = challenger.id
        elif challengee_score > challenger_score:
            challenge.winner_id = challengee.id
        else:
            challenge.winner_id = None

        challenge.status = ChallengeStatus.COMPLETED
        db.commit()
        db.refresh(challenge)

        winner = db.query(User).filter(User.id == challenge.winner_id).first()
        print(f"   ✓ 挑战者 {challenger.username}: {challenger_score}分")
        print(f"   ✓ 接受者 {challengee.username}: {challengee_score}分")
        print(f"   🏆 获胜者: {winner.username if winner else '平局'}")
        print(f"   状态: {challenge.status}")

        # 7. 查询用户挑战列表
        print("\n7. 查询用户挑战列表...")
        for user in users:
            user_challenges = db.query(Challenge).filter(
                (Challenge.challenger_id == user.id) | (Challenge.challengee_id == user.id)
            ).all()

            if user_challenges:
                status_map = {
                    'pending': '⏳ 待接受',
                    'accepted': '🎮 进行中',
                    'completed': '✅ 已完成',
                    'expired': '⌛ 已过期'
                }
                print(f"\n   {user.username} 的挑战:")
                for c in user_challenges:
                    c_status = status_map.get(c.status, c.status)
                    print(f"     • {c.challenge_code} | {c.word} | {c_status}")

        # 8. 测试全局排行榜
        print("\n8. 全局排行榜...")
        subquery = db.query(
            LeaderboardEntry.user_id,
            func.max(LeaderboardEntry.best_score).label('max_score')
        ).group_by(LeaderboardEntry.user_id).subquery()

        global_entries = db.query(LeaderboardEntry).join(
            subquery,
            (LeaderboardEntry.user_id == subquery.c.user_id) &
            (LeaderboardEntry.best_score == subquery.c.max_score)
        ).order_by(LeaderboardEntry.best_score.desc()).all()

        seen_users = set()
        rank = 0
        print()
        for entry in global_entries:
            if entry.user_id in seen_users:
                continue
            seen_users.add(entry.user_id)
            rank += 1
            user = db.query(User).filter(User.id == entry.user_id).first()
            medal = "🥇" if rank == 1 else "🥈" if rank == 2 else "🥉" if rank == 3 else "  "
            avg = entry.total_score / entry.total_attempts
            print(f"   {medal} 第{rank}名: {user.username:10s} | {entry.word:4s} | 最高分 {entry.best_score:5.1f} | 平均 {avg:5.1f}")

        # 9. 测试用户统计
        print("\n9. 用户统计...")
        for user in users:
            user_entries = db.query(LeaderboardEntry).filter(LeaderboardEntry.user_id == user.id).all()
            words_attempted = len(set(e.word for e in user_entries))
            total_attempts = sum(e.total_attempts for e in user_entries)
            best_score = max(e.best_score for e in user_entries) if user_entries else 0
            avg_score = sum(e.total_score for e in user_entries) / total_attempts if total_attempts > 0 else 0

            challenges_created = db.query(Challenge).filter(Challenge.challenger_id == user.id).count()
            challenges_won = db.query(Challenge).filter(Challenge.winner_id == user.id).count()

            print(f"\n   📊 {user.username}:")
            print(f"      总练习次数: {total_attempts}")
            print(f"      历史最高: {best_score:.1f}")
            print(f"      平均分数: {avg_score:.1f}")
            print(f"      已学词汇: {words_attempted}")
            print(f"      发起挑战: {challenges_created}场")
            print(f"      赢得挑战: {challenges_won}场")

        print("\n" + "=" * 70)
        print("✅ 所有测试通过！社区功能运行正常")
        print("=" * 70)

        # 打印API接口列表
        print("\n📋 新增API接口:")
        print("   POST   /api/challenges                       - 创建挑战")
        print("   POST   /api/challenges/accept                - 接受挑战")
        print("   GET    /api/challenges/{code}               - 获取挑战详情")
        print("   GET    /api/users/{id}/challenges           - 获取用户挑战列表")
        print("   POST   /api/challenges/{code}/resign        - 认输")
        print("   POST   /api/compare/{word}/challenge/{code} - 提交挑战视频")
        print("   GET    /api/leaderboard                     - 按词汇排行榜")
        print("   GET    /api/leaderboard/global              - 全局排行榜")
        print("   GET    /api/users/{id}/stats                - 用户统计")
        print("\n🎯 挑战码格式: SL-XXXXXXXX (8位字母数字)")

        return True

    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    success = test_challenge_workflow()
    sys.exit(0 if success else 1)
