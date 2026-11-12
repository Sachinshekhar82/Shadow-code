import sys
import os
import json

# Ensure workspace root is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from evaluation.benchmarks import SecurityEvaluationHarness

if __name__ == "__main__":
    print("=================================================================")
    print("   SHADOW-CODE: EMPIRICAL SDLC SECURITY BENCHMARK HARNESS")
    print("=================================================================\n")
    harness = SecurityEvaluationHarness()
    print("[*] Running benchmarks on ground-truth vulnerable and secure fixtures...")
    results = harness.run_and_export()
    
    print("\n[+] Benchmark Results:\n")
    for b in results["benchmarks"]:
        print(f"--- {b['pipeline']} ---")
        print(f"  Execution Time : {b['execution_time_seconds']}s")
        print(f"  Findings Count : {b['findings_count']}")
        print(f"  Precision      : {b['precision'] * 100:.1f}%")
        print(f"  Recall         : {b['recall'] * 100:.1f}%")
        print(f"  F1 Score       : {b['f1_score']:.3f}")
        print(f"  FPR            : {b['false_positive_rate'] * 100:.1f}%")
        if "patch_validation_rate" in b:
            print(f"  Patch Val Rate : {b['patch_validation_rate'] * 100:.1f}%")
        print()

    print("[*] Exported evaluation reports:")
    print("  - evaluation/results/evaluation_metrics.json")
    print("  - evaluation/results/evaluation_metrics.csv")
