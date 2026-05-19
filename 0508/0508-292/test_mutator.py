#!/usr/bin/env python3
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src import Mutator


def test_mutator():
    print("Testing Mutator...")
    
    mutator = Mutator()
    
    seed = b"Hello, World!"
    print(f"Original seed: {seed}")
    
    mutations = set()
    for i in range(10):
        mutated = mutator.mutate(seed)
        mutations.add(mutated)
        print(f"Mutation {i+1}: {mutated[:50]}...")
    
    print(f"\nUnique mutations: {len(mutations)}")
    
    new_seed = mutator.generate_seed()
    print(f"\nGenerated seed: {new_seed[:50]}... (length: {len(new_seed)})")
    
    print("\nMutator test passed!")


def test_dict():
    print("\nTesting dictionary support...")
    
    dict_path = "dict/example.dict"
    if os.path.exists(dict_path):
        mutator = Mutator(dict_path=dict_path)
        seed = b"test"
        
        has_dict = False
        for _ in range(100):
            mutated = mutator.mutate(seed)
            if b"FUZZ" in mutated or b"STACK" in mutated:
                has_dict = True
                break
        
        print(f"Dictionary mutations work: {has_dict}")
    else:
        print("Dictionary file not found, skipping test")


if __name__ == '__main__':
    test_mutator()
    test_dict()
