import json
import time
from datetime import datetime, timedelta
from collections import defaultdict
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, Base, engine
from app.models.command import (
    GateCommand, MergedCommand, ExecutionQueue, ExecutionReceipt,
    DedupeAudit, CommandSource, SOURCE_PRIORITY,
)
from app.schemas.command import (
    CommandIn, SourceDedupeSummary, SourceDedupeSummaryItem,
    ReplacedDailySummary, ReplacedSummaryItem,
)
from app.services.command_merge import CommandMergeService


def test_priority_fix():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        gate_code = "GATE-TEST-001"
        time_slot = "2026-05-25T10:00:00/2026-05-25T10:30:00"

        print("=" * 60)
        print("测试场景：5分钟内补发(interval) + 人工纠正(manual)先后到达")
        print("=" * 60)

        print(f"\n步骤1：先收到上游调度指令 - 关闸")
        cmd1 = CommandIn(
            gate_code=gate_code,
            action="close",
            time_slot=time_slot,
            plan_version=1,
            raw_payload='{"from":"upstream","version":1}',
            requested_at=datetime.utcnow() - timedelta(seconds=10),
        )
        svc = CommandMergeService(db)
        result1 = svc.process_command(cmd1, CommandSource.UPSTREAM)
        print(f"  合并结果: id={result1.merged.id}, source={result1.merged.source}, "
              f"action={result1.merged.action}, priority={result1.merged.priority}, is_new={result1.is_new}")

        print(f"\n步骤2：30秒后收到区间补发指令 - 开闸")
        cmd2 = CommandIn(
            gate_code=gate_code,
            action="open",
            time_slot=time_slot,
            plan_version=1,
            raw_payload='{"from":"interval","version":1}',
            requested_at=datetime.utcnow() - timedelta(seconds=10),
        )
        svc2 = CommandMergeService(db)
        result2 = svc2.process_command(cmd2, CommandSource.INTERVAL)
        print(f"  合并结果: id={result2.merged.id}, source={result2.merged.source}, "
              f"action={result2.merged.action}, priority={result2.merged.priority}, is_new={result2.is_new}")
        assert result2.merged.source == CommandSource.INTERVAL, "补发优先级应高于上游"
        assert result2.merged.action == "open", "动作应更新为补发的开闸"
        assert result2.is_new == True, "应创建新的合并指令"
        assert result2.replaced is not None, "旧指令应被标记为非活跃"
        assert result2.replaced.is_active == False, "旧合并指令应被置为非活跃"
        print("  ✓ 补发正确覆盖了上游调度")

        print(f"\n步骤3：再20秒后收到人工纠正指令 - 保持开闸（相同动作）")
        cmd3 = CommandIn(
            gate_code=gate_code,
            action="open",
            time_slot=time_slot,
            plan_version=1,
            raw_payload='{"from":"manual","version":1}',
            requested_at=datetime.utcnow() - timedelta(seconds=10),
        )
        svc3 = CommandMergeService(db)
        result3 = svc3.process_command(cmd3, CommandSource.MANUAL)
        print(f"  合并结果: id={result3.merged.id}, source={result3.merged.source}, "
              f"action={result3.merged.action}, priority={result3.merged.priority}, is_new={result3.is_new}")
        assert result3.merged.source == CommandSource.MANUAL, "人工优先级应高于补发"
        assert result3.merged.action == "open", "动作应保持开闸"
        assert result3.is_new == True, "即使动作相同，高优先级也应创建新合并记录"
        print("  ✓ 人工纠正正确覆盖了补发（相同动作也保留优先级）")

        print(f"\n步骤4：10秒后收到人工纠正指令 - 关闸（更高版本）")
        cmd4 = CommandIn(
            gate_code=gate_code,
            action="close",
            time_slot=time_slot,
            plan_version=2,
            raw_payload='{"from":"manual","version":2}',
            requested_at=datetime.utcnow() - timedelta(seconds=10),
        )
        svc4 = CommandMergeService(db)
        result4 = svc4.process_command(cmd4, CommandSource.MANUAL)
        print(f"  合并结果: id={result4.merged.id}, source={result4.merged.source}, "
              f"action={result4.merged.action}, priority={result4.merged.priority}, is_new={result4.is_new}")
        assert result4.merged.source == CommandSource.MANUAL
        assert result4.merged.action == "close", "动作应更新为新版本的关闸"
        assert result4.merged.plan_version == 2, "版本号应提升"
        print("  ✓ 同来源高版本指令正确覆盖低版本")

        print(f"\n步骤5：验证队列状态")
        queue_items = db.query(ExecutionQueue).filter(
            ExecutionQueue.gate_code == gate_code
        ).order_by(ExecutionQueue.id.desc()).all()
        print(f"  队列记录数: {len(queue_items)}")
        for q in queue_items:
            print(f"    - id={q.id}, merged_id={q.merged_command_id}, "
                  f"action={q.action}, status={q.status}")

        pending = db.query(ExecutionQueue).filter(
            ExecutionQueue.status == "pending",
            ExecutionQueue.gate_code == gate_code,
        ).order_by(ExecutionQueue.id.desc()).first()
        print(f"  当前待执行: action={pending.action}, merged_id={pending.merged_command_id}")
        assert pending.action == "close", "队列中应是最新的关闸动作，而不是旧的开闸"
        print("  ✓ 队列正确更新为最新高优先级指令，没有被旧指令覆盖")

        print(f"\n步骤6：验证去重审计记录")
        audits = db.query(DedupeAudit).filter(
            DedupeAudit.gate_code == gate_code
        ).order_by(DedupeAudit.id.asc()).all()
        print(f"  审计记录数: {len(audits)}")
        for a in audits:
            print(f"    - id={a.id}, {a.winning_source}({a.winning_action}) > "
                  f"{a.losing_source}({a.losing_action}), reason={a.reason}")
        assert len(audits) >= 3, "每次优先级覆盖都应留存审计记录"
        print("  ✓ 去重前后对照记录完整，回执汇总不会丢")

        print(f"\n步骤7：验证原始指令都被留存")
        raw_cmds = db.query(GateCommand).filter(
            GateCommand.gate_code == gate_code
        ).order_by(GateCommand.id.asc()).all()
        print(f"  原始指令数: {len(raw_cmds)}")
        for c in raw_cmds:
            print(f"    - id={c.id}, source={c.source}, action={c.action}, "
                  f"is_merged={c.is_merged}, plan_version={c.plan_version}")
        assert len(raw_cmds) == 4, "4条原始指令都应留存"
        assert all(c.is_merged for c in raw_cmds), "所有原始指令都应标记为已合并"
        print("  ✓ 所有原始指令留存完整")

        print(f"\n步骤8：验证按来源回看去重结果")
        _test_source_dedupe_summary(db, gate_code)

        print(f"\n步骤9：验证近一天被替换指令摘要")
        _test_replaced_daily_summary(db, gate_code)

        print("\n" + "=" * 60)
        print("✅ 测试通过！5分钟窗口内高优先级指令不会被旧指令吞没")
        print("=" * 60)

    finally:
        db.query(DedupeAudit).filter(DedupeAudit.gate_code.like("GATE-TEST-%")).delete()
        db.query(ExecutionReceipt).filter(ExecutionReceipt.gate_code.like("GATE-TEST-%")).delete()
        db.query(ExecutionQueue).filter(ExecutionQueue.gate_code.like("GATE-TEST-%")).delete()
        db.query(MergedCommand).filter(MergedCommand.gate_code.like("GATE-TEST-%")).delete()
        db.query(GateCommand).filter(GateCommand.gate_code.like("GATE-TEST-%")).delete()
        db.commit()
        db.close()


def _test_source_dedupe_summary(db: Session, gate_code: str):
    period_end = datetime.utcnow()
    period_start = period_end - timedelta(hours=24)

    audits = db.query(DedupeAudit).filter(
        DedupeAudit.created_at >= period_start,
        DedupeAudit.created_at <= period_end,
        DedupeAudit.gate_code == gate_code,
    ).all()

    print(f"  时间范围: {period_start} ~ {period_end}")
    print(f"  审计记录总数: {len(audits)}")

    source_stats: dict[CommandSource, dict] = {}
    all_sources = [CommandSource.UPSTREAM, CommandSource.INTERVAL, CommandSource.MANUAL]
    for s in all_sources:
        source_stats[s] = {
            "total_commands": 0, "merged_count": 0, "replaced_count": 0,
            "win_count": 0, "lose_count": 0,
            "win_actions": defaultdict(int), "lose_actions": defaultdict(int),
        }

    for audit in audits:
        if audit.winning_source in source_stats:
            stats = source_stats[audit.winning_source]
            stats["win_count"] += 1
            stats["win_actions"][audit.winning_action] += 1
            stats["merged_count"] += 1
            stats["replaced_count"] += 1

        if audit.losing_source in source_stats:
            stats = source_stats[audit.losing_source]
            stats["lose_count"] += 1
            stats["lose_actions"][audit.losing_action] += 1
            stats["replaced_count"] += 1

    for s in all_sources:
        source_stats[s]["total_commands"] = (
            source_stats[s]["win_count"] + source_stats[s]["lose_count"]
        )

    print(f"  按来源汇总:")
    for s in all_sources:
        stats = source_stats[s]
        print(f"    [{s.value}] 指令总数={stats['total_commands']}, "
              f"胜出={stats['win_count']}(open:{stats['win_actions']['open']}, close:{stats['win_actions']['close']}), "
              f"落败={stats['lose_count']}(open:{stats['lose_actions']['open']}, close:{stats['lose_actions']['close']})")

    assert source_stats[CommandSource.UPSTREAM]["win_count"] == 0, "上游不应胜出"
    assert source_stats[CommandSource.UPSTREAM]["lose_count"] >= 1, "上游至少落败1次"
    assert source_stats[CommandSource.MANUAL]["win_count"] >= 2, "人工至少胜出2次"
    assert source_stats[CommandSource.INTERVAL]["lose_count"] >= 1, "补发至少落败1次"
    print("  ✓ 按来源回看去重结果正确")


def _test_replaced_daily_summary(db: Session, gate_code: str):
    period_end = datetime.utcnow()
    period_start = period_end - timedelta(days=1)

    audits = db.query(DedupeAudit).filter(
        DedupeAudit.created_at >= period_start,
        DedupeAudit.created_at <= period_end,
        DedupeAudit.gate_code == gate_code,
    ).all()

    groups: dict[tuple[CommandSource, str], dict] = {}
    gate_counter: dict[str, int] = defaultdict(int)

    for audit in audits:
        key = (audit.losing_source, audit.losing_action)
        if key not in groups:
            groups[key] = {
                "count": 0, "sample_gate_codes": [],
                "sample_audit_ids": [], "winning_sources": set(),
            }
        group = groups[key]
        group["count"] += 1
        if len(group["sample_gate_codes"]) < 5 and audit.gate_code not in group["sample_gate_codes"]:
            group["sample_gate_codes"].append(audit.gate_code)
        if len(group["sample_audit_ids"]) < 5:
            group["sample_audit_ids"].append(audit.id)
        group["winning_sources"].add(audit.winning_source)
        gate_counter[audit.gate_code] += 1

    total_replaced = len(audits)
    print(f"  日期: {period_start.strftime('%Y-%m-%d')}")
    print(f"  被替换指令总数: {total_replaced}")

    by_source_action = []
    for (losing_source, losing_action), data in sorted(
        groups.items(), key=lambda x: x[1]["count"], reverse=True
    ):
        by_source_action.append({
            "losing_source": losing_source,
            "losing_action": losing_action,
            "count": data["count"],
            "sample_gate_codes": data["sample_gate_codes"],
            "winning_sources": list(data["winning_sources"]),
        })

    for item in by_source_action:
        print(f"    [{item['losing_source'].value}] {item['losing_action']}: "
              f"{item['count']}条, 被{item['winning_sources']}替代, 闸门样例={item['sample_gate_codes']}")

    most_replaced_gate = max(gate_counter, key=gate_counter.get) if gate_counter else None
    most_replaced_count = gate_counter.get(most_replaced_gate, 0) if most_replaced_gate else 0
    print(f"  被替换最多的闸门: {most_replaced_gate} ({most_replaced_count}次)")

    assert total_replaced >= 3, "至少3条被替换记录"
    assert most_replaced_gate == gate_code, "测试闸门应是被替换最多的"
    print("  ✓ 近一天被替换指令摘要正确")


if __name__ == "__main__":
    test_priority_fix()
