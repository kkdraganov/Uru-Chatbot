#!/usr/bin/env python3
"""
Pre-commit Test Script

This script tests the pre-commit configuration by creating temporary files
with various issues and running pre-commit hooks to ensure they work correctly.
"""

import os
import subprocess
import tempfile
from pathlib import Path
from typing import List, Tuple
import shutil


class PreCommitTester:
    """Test pre-commit hooks functionality."""
    
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.test_results: List[Tuple[str, bool, str]] = []
        
    def run_command(self, cmd: List[str], cwd: Path = None) -> Tuple[bool, str]:
        """Run a command and return success status and output."""
        try:
            result = subprocess.run(
                cmd,
                cwd=cwd or self.project_root,
                capture_output=True,
                text=True,
                timeout=60
            )
            return result.returncode == 0, result.stdout + result.stderr
        except subprocess.TimeoutExpired:
            return False, "Command timed out"
        except Exception as e:
            return False, str(e)
            
    def test_python_hooks(self) -> None:
        """Test Python-related hooks."""
        print("🐍 Testing Python hooks...")
        
        # Create a temporary Python file with issues
        test_file = self.project_root / "backend" / "test_temp.py"
        try:
            with open(test_file, 'w') as f:
                f.write("""
# This file has intentional issues for testing
import os,sys
import json

def bad_function( x,y ):
    password = "hardcoded_password"  # Security issue
    if x==y:
        print("Equal")
    return x+y

class BadClass:
    def __init__(self):
        pass
        
unused_var = "this is unused"
""")
            
            # Test Ruff linting
            success, output = self.run_command(["pre-commit", "run", "ruff", "--files", str(test_file)])
            self.test_results.append(("Ruff linting", not success, "Should catch linting issues"))
            
            # Test Ruff formatting
            success, output = self.run_command(["pre-commit", "run", "ruff-format", "--files", str(test_file)])
            self.test_results.append(("Ruff formatting", True, "Should format the file"))
            
            # Test Bandit security scan
            success, output = self.run_command(["pre-commit", "run", "bandit", "--files", str(test_file)])
            self.test_results.append(("Bandit security", not success, "Should catch security issues"))
            
        finally:
            # Clean up
            if test_file.exists():
                test_file.unlink()
                
    def test_frontend_hooks(self) -> None:
        """Test frontend-related hooks."""
        print("⚛️  Testing frontend hooks...")
        
        # Create a temporary TypeScript file with issues
        test_file = self.project_root / "frontend" / "src" / "test_temp.tsx"
        test_file.parent.mkdir(exist_ok=True)
        
        try:
            with open(test_file, 'w') as f:
                f.write("""
import React from 'react';
import {useState} from 'react';

const BadComponent = () => {
const [count,setCount] = useState(0);
const unused = "unused variable";

return <div onClick={()=>{setCount(count+1)}}>{count}</div>;
};

export default BadComponent;
""")
            
            # Test ESLint
            success, output = self.run_command(["pre-commit", "run", "eslint", "--files", str(test_file)])
            self.test_results.append(("ESLint", not success, "Should catch linting issues"))
            
            # Test Prettier
            success, output = self.run_command(["pre-commit", "run", "prettier", "--files", str(test_file)])
            self.test_results.append(("Prettier", True, "Should format the file"))
            
        finally:
            # Clean up
            if test_file.exists():
                test_file.unlink()
                
    def test_docker_hooks(self) -> None:
        """Test Docker-related hooks."""
        print("🐳 Testing Docker hooks...")
        
        # Test existing Dockerfiles
        dockerfiles = [
            "backend/Dockerfile",
            "backend/Dockerfile.dev",
            "frontend/Dockerfile",
            "frontend/Dockerfile.dev"
        ]
        
        for dockerfile in dockerfiles:
            dockerfile_path = self.project_root / dockerfile
            if dockerfile_path.exists():
                success, output = self.run_command(["pre-commit", "run", "hadolint-docker", "--files", str(dockerfile_path)])
                self.test_results.append((f"Hadolint {dockerfile}", success, "Should validate Dockerfile"))
                
    def test_custom_hooks(self) -> None:
        """Test custom validation hooks."""
        print("🔧 Testing custom hooks...")
        
        # Test MCP schema validation
        success, output = self.run_command(["pre-commit", "run", "validate-mcp-schemas"])
        self.test_results.append(("MCP schema validation", success, "Should validate MCP schemas"))
        
        # Test environment file validation
        success, output = self.run_command(["pre-commit", "run", "validate-env-files"])
        self.test_results.append(("Environment file validation", success, "Should validate env files"))
        
    def test_general_hooks(self) -> None:
        """Test general file hooks."""
        print("📄 Testing general file hooks...")
        
        # Create a temporary file with trailing whitespace
        test_file = self.project_root / "test_temp.txt"
        try:
            with open(test_file, 'w') as f:
                f.write("Line with trailing spaces   \n")
                f.write("Line without newline at end")
                
            # Test trailing whitespace
            success, output = self.run_command(["pre-commit", "run", "trailing-whitespace", "--files", str(test_file)])
            self.test_results.append(("Trailing whitespace", not success, "Should fix trailing whitespace"))
            
            # Test end of file fixer
            success, output = self.run_command(["pre-commit", "run", "end-of-file-fixer", "--files", str(test_file)])
            self.test_results.append(("End of file fixer", not success, "Should add final newline"))
            
        finally:
            # Clean up
            if test_file.exists():
                test_file.unlink()
                
    def test_yaml_json_hooks(self) -> None:
        """Test YAML and JSON validation hooks."""
        print("📋 Testing YAML/JSON hooks...")
        
        # Test invalid YAML
        test_yaml = self.project_root / "test_temp.yaml"
        try:
            with open(test_yaml, 'w') as f:
                f.write("invalid: yaml: content:\n  - item1\n - item2")  # Invalid indentation
                
            success, output = self.run_command(["pre-commit", "run", "check-yaml", "--files", str(test_yaml)])
            self.test_results.append(("YAML validation", not success, "Should catch YAML syntax errors"))
            
        finally:
            if test_yaml.exists():
                test_yaml.unlink()
                
        # Test invalid JSON
        test_json = self.project_root / "test_temp.json"
        try:
            with open(test_json, 'w') as f:
                f.write('{"invalid": json, "missing": "quotes"}')  # Invalid JSON
                
            success, output = self.run_command(["pre-commit", "run", "check-json", "--files", str(test_json)])
            self.test_results.append(("JSON validation", not success, "Should catch JSON syntax errors"))
            
        finally:
            if test_json.exists():
                test_json.unlink()
                
    def run_all_tests(self) -> None:
        """Run all pre-commit tests."""
        print("🚀 Starting pre-commit hook tests...\n")
        
        # Check if pre-commit is installed
        success, output = self.run_command(["pre-commit", "--version"])
        if not success:
            print("❌ Pre-commit is not installed or not in PATH")
            return
            
        print(f"✅ Pre-commit version: {output.strip()}\n")
        
        # Run individual test suites
        self.test_general_hooks()
        self.test_yaml_json_hooks()
        self.test_python_hooks()
        self.test_frontend_hooks()
        self.test_docker_hooks()
        self.test_custom_hooks()
        
        # Print results
        self.print_results()
        
    def print_results(self) -> None:
        """Print test results summary."""
        print("\n" + "="*60)
        print("📊 PRE-COMMIT TEST RESULTS")
        print("="*60)
        
        passed = 0
        failed = 0
        
        for test_name, success, description in self.test_results:
            status = "✅ PASS" if success else "❌ FAIL"
            print(f"{status:<10} {test_name:<30} {description}")
            
            if success:
                passed += 1
            else:
                failed += 1
                
        print("-"*60)
        print(f"Total: {len(self.test_results)} | Passed: {passed} | Failed: {failed}")
        
        if failed == 0:
            print("\n🎉 All pre-commit hooks are working correctly!")
        else:
            print(f"\n⚠️  {failed} test(s) failed. This may be expected for some hooks.")
            print("Review the results above and ensure hooks are working as intended.")


def main():
    """Main entry point."""
    tester = PreCommitTester()
    tester.run_all_tests()


if __name__ == "__main__":
    main()
