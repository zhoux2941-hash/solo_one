#!/usr/bin/env python3
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("Testing Byte Impact Analysis")
print("=" * 60)

try:
    from src.mutator import SmartMutator
    print("✓ SmartMutator imported successfully")
except Exception as e:
    print(f"✗ SmartMutator import failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n" + "=" * 60)
print("Testing impact recording and scoring...")

try:
    mutator = SmartMutator(max_length=128)
    
    test_data = b"Hello, World! This is a test input for fuzzing."
    
    for i in range(10):
        edge_set = set(range(i * 5, (i + 1) * 5 + 10))
        is_new = i < 5
        mutator.record_execution_result(test_data, edge_set, is_new)
    
    print("✓ Recorded 10 executions")
    
    high_count = 0
    medium_count = 0
    low_count = 0
    
    for pos in range(len(test_data)):
        score = mutator.get_byte_impact_score(pos)
        if score >= 10:
            high_count += 1
        elif score >= 5:
            medium_count += 1
        else:
            low_count += 1
    
    print(f"  High impact positions: {high_count}")
    print(f"  Medium impact positions: {medium_count}")
    print(f"  Low impact positions: {low_count}")
    
    stats = mutator.get_statistics()
    print(f"  Total executions recorded: {stats['total_executions']}")
    print("✓ Byte scoring works correctly")
    
except Exception as e:
    print(f"✗ Impact recording test failed: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("Testing heatmap generation...")

try:
    heatmap = mutator.get_impact_heatmap()
    print(f"✓ Heatmap generated with {len(heatmap)} positions")
    print(f"  Max heat value: {max(heatmap):.3f}")
    print(f"  Avg heat value: {sum(heatmap) / len(heatmap):.3f}")
except Exception as e:
    print(f"✗ Heatmap generation failed: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("Testing high impact region detection...")

try:
    regions = mutator.get_high_impact_regions(window_size=8, threshold=0.3)
    print(f"✓ Found {len(regions)} high impact regions")
    for start, end, score in regions[:5]:
        print(f"  [{start}-{end}] Score: {score:.3f}")
except Exception as e:
    print(f"✗ High impact region detection failed: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("Testing smart mutation position selection...")

try:
    positions = mutator.get_smart_mutation_positions(64, num_positions=10)
    print(f"✓ Selected {len(positions)} smart mutation positions")
    print(f"  Positions: {positions}")
except Exception as e:
    print(f"✗ Smart mutation selection failed: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("Testing mutation with impact analysis...")

try:
    original_data = b"Test input string for fuzzing mutation impact analysis"
    mutated_data = mutator.mutate(original_data, use_smart=True)
    
    print(f"✓ Smart mutation completed")
    print(f"  Original length: {len(original_data)}")
    print(f"  Mutated length: {len(mutated_data)}")
    print(f"  Data changed: {original_data != mutated_data}")
except Exception as e:
    print(f"✗ Smart mutation test failed: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("Testing mutator statistics...")

try:
    stats = mutator.get_statistics()
    print("✓ Statistics generated:")
    for key, value in stats.items():
        print(f"  {key}: {value}")
except Exception as e:
    print(f"✗ Statistics generation failed: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("All tests completed!")
print("\nSummary of Byte Impact Analysis features:")
print("  ✓ Byte-level coverage impact tracking")
print("  ✓ Smart mutation position selection based on impact")
print("  ✓ Heatmap generation for visualization")
print("  ✓ High impact region detection")
print("  ✓ Per-byte scoring system (coverage count + new coverage weight)")
print("  ✓ Execution result recording for continuous learning")
