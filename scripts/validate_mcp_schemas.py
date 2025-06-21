#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MCP Tool Schema Validation Script

This script validates MCP (Model Context Protocol) tool schemas and structures
to ensure they conform to the expected format and standards.
"""

import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Set
import re


class MCPSchemaValidator:
    """Validator for MCP tool schemas and structures."""

    def __init__(self):
        self.errors: List[str] = []
        self.warnings: List[str] = []

    def validate_json_schema(self, schema: Dict[str, Any], file_path: str) -> bool:
        """Validate a JSON schema structure."""
        valid = True

        # Check required top-level fields
        required_fields = {"$schema", "type", "properties"}
        missing_fields = required_fields - set(schema.keys())
        if missing_fields:
            self.errors.append(f"{file_path}: Missing required fields: {missing_fields}")
            valid = False

        # Validate schema version
        if "$schema" in schema:
            schema_url = schema["$schema"]
            if not schema_url.startswith("http://json-schema.org/"):
                self.warnings.append(f"{file_path}: Non-standard schema URL: {schema_url}")

        # Validate type
        if "type" in schema and schema["type"] != "object":
            self.warnings.append(f"{file_path}: Expected type 'object', got '{schema['type']}'")

        # Validate properties structure
        if "properties" in schema:
            self._validate_properties(schema["properties"], file_path)

        return valid

    def _validate_properties(self, properties: Dict[str, Any], file_path: str) -> None:
        """Validate properties section of a schema."""
        for prop_name, prop_def in properties.items():
            if not isinstance(prop_def, dict):
                self.errors.append(f"{file_path}: Property '{prop_name}' must be an object")
                continue

            # Check for required type field
            if "type" not in prop_def:
                self.errors.append(f"{file_path}: Property '{prop_name}' missing 'type' field")

            # Check for description
            if "description" not in prop_def:
                self.warnings.append(f"{file_path}: Property '{prop_name}' missing description")

            # Validate enum values if present
            if "enum" in prop_def and "type" in prop_def:
                self._validate_enum(prop_def, prop_name, file_path)

    def _validate_enum(self, prop_def: Dict[str, Any], prop_name: str, file_path: str) -> None:
        """Validate enum property definitions."""
        enum_values = prop_def["enum"]
        prop_type = prop_def["type"]

        if not isinstance(enum_values, list):
            self.errors.append(f"{file_path}: Property '{prop_name}' enum must be a list")
            return

        # Check enum values match the declared type
        for value in enum_values:
            if prop_type == "string" and not isinstance(value, str):
                self.errors.append(f"{file_path}: Property '{prop_name}' enum value '{value}' is not a string")
            elif prop_type == "integer" and not isinstance(value, int):
                self.errors.append(f"{file_path}: Property '{prop_name}' enum value '{value}' is not an integer")

    def validate_mcp_tool_function(self, func_code: str, file_path: str) -> bool:
        """Validate MCP tool function structure in Python code."""
        valid = True

        # Check for function definition patterns
        function_pattern = r'def\s+(\w+)\s*\([^)]*\)\s*:'
        functions = re.findall(function_pattern, func_code)

        if not functions:
            self.warnings.append(f"{file_path}: No function definitions found")
            return valid

        # Check for docstrings
        docstring_pattern = r'def\s+\w+\s*\([^)]*\)\s*:\s*"""[^"]*"""'
        functions_with_docs = re.findall(docstring_pattern, func_code, re.DOTALL)

        if len(functions_with_docs) < len(functions):
            self.warnings.append(f"{file_path}: Some functions missing docstrings")

        # Check for type hints
        typed_function_pattern = r'def\s+\w+\s*\([^)]*:\s*[^)]+\)\s*->\s*[^:]+'
        typed_functions = re.findall(typed_function_pattern, func_code)

        if len(typed_functions) < len(functions):
            self.warnings.append(f"{file_path}: Some functions missing type hints")

        return valid

    def validate_openapi_spec(self, spec: Dict[str, Any], file_path: str) -> bool:
        """Validate OpenAPI specification structure."""
        valid = True

        # Check required OpenAPI fields
        required_fields = {"openapi", "info", "paths"}
        missing_fields = required_fields - set(spec.keys())
        if missing_fields:
            self.errors.append(f"{file_path}: Missing required OpenAPI fields: {missing_fields}")
            valid = False

        # Validate OpenAPI version
        if "openapi" in spec:
            version = spec["openapi"]
            if not version.startswith("3."):
                self.warnings.append(f"{file_path}: OpenAPI version should be 3.x, got {version}")

        # Validate paths
        if "paths" in spec:
            for path, methods in spec["paths"].items():
                if not path.startswith("/"):
                    self.errors.append(f"{file_path}: Path '{path}' should start with '/'")
                    valid = False

                for method, operation in methods.items():
                    if method.upper() not in ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]:
                        self.warnings.append(f"{file_path}: Unusual HTTP method '{method}' for path '{path}'")

        return valid

    def scan_directory(self, directory: Path) -> bool:
        """Scan directory for files to validate."""
        all_valid = True
        found_mcp_files = False

        # Find JSON schema files (only MCP-related ones)
        json_files = list(directory.rglob("*.json"))
        for json_file in json_files:
            if self._should_validate_json(json_file):
                try:
                    with open(json_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)

                    if self._is_json_schema(data):
                        found_mcp_files = True
                        if not self.validate_json_schema(data, str(json_file)):
                            all_valid = False
                    elif self._is_openapi_spec(data) and self._is_mcp_related_openapi(data):
                        found_mcp_files = True
                        if not self.validate_openapi_spec(data, str(json_file)):
                            all_valid = False

                except json.JSONDecodeError as e:
                    # Only report JSON errors for MCP-related files
                    if self._is_mcp_related_file(json_file):
                        self.errors.append(f"{json_file}: Invalid JSON - {e}")
                        all_valid = False
                except Exception as e:
                    if self._is_mcp_related_file(json_file):
                        self.errors.append(f"{json_file}: Error reading file - {e}")
                        all_valid = False

        # Find Python files with MCP tools
        python_files = list(directory.rglob("*.py"))
        for py_file in python_files:
            if self._should_validate_python(py_file):
                try:
                    with open(py_file, 'r', encoding='utf-8') as f:
                        code = f.read()

                    if self._contains_mcp_tools(code):
                        found_mcp_files = True
                        if not self.validate_mcp_tool_function(code, str(py_file)):
                            all_valid = False

                except Exception as e:
                    self.errors.append(f"{py_file}: Error reading file - {e}")
                    all_valid = False

        # If no MCP files found, consider it valid (don't block commits)
        if not found_mcp_files:
            return True

        return all_valid

    def _should_validate_json(self, file_path: Path) -> bool:
        """Check if JSON file should be validated."""
        # Skip node_modules, build directories, etc.
        skip_dirs = {"node_modules", ".next", "build", "dist", "__pycache__", ".git", ".vscode"}
        return not any(part in skip_dirs for part in file_path.parts)

    def _should_validate_python(self, file_path: Path) -> bool:
        """Check if Python file should be validated."""
        # Skip migrations, tests, etc.
        skip_dirs = {"migrations", "__pycache__", ".git", "node_modules"}
        skip_files = {"__init__.py"}
        return (not any(part in skip_dirs for part in file_path.parts) and
                file_path.name not in skip_files)

    def _is_json_schema(self, data: Dict[str, Any]) -> bool:
        """Check if JSON data is a JSON Schema."""
        return "$schema" in data and "json-schema.org" in data["$schema"]

    def _is_openapi_spec(self, data: Dict[str, Any]) -> bool:
        """Check if JSON data is an OpenAPI specification."""
        return "openapi" in data or "swagger" in data

    def _contains_mcp_tools(self, code: str) -> bool:
        """Check if Python code contains MCP tool definitions."""
        # Look for common MCP patterns
        mcp_patterns = [
            r'@tool',
            r'def.*tool.*\(',
            r'class.*Tool.*:',
            r'mcp',
            r'model.*context.*protocol',
        ]
        return any(re.search(pattern, code, re.IGNORECASE) for pattern in mcp_patterns)

    def _is_mcp_related_openapi(self, data: Dict[str, Any]) -> bool:
        """Check if OpenAPI spec is MCP-related."""
        # Look for MCP-specific patterns in the API spec
        if "info" in data and "title" in data["info"]:
            title = data["info"]["title"].lower()
            return "mcp" in title or "model context protocol" in title
        return False

    def _is_mcp_related_file(self, file_path: Path) -> bool:
        """Check if file is MCP-related based on path or name."""
        path_str = str(file_path).lower()
        return "mcp" in path_str or "tool" in path_str

    def print_results(self) -> None:
        """Print validation results."""
        if self.errors:
            print("X ERRORS:")
            for error in self.errors:
                print(f"  {error}")

        if self.warnings:
            print("! WARNINGS:")
            for warning in self.warnings:
                print(f"  {warning}")

        if not self.errors and not self.warnings:
            print("✓ All MCP schemas and tools are valid!")
        elif not self.errors:
            print("! No errors found, but there are warnings to address.")


def main():
    """Main entry point."""
    validator = MCPSchemaValidator()

    # Get project root directory
    project_root = Path(__file__).parent.parent

    # Validate all relevant files
    is_valid = validator.scan_directory(project_root)

    # Print results
    if not validator.errors and not validator.warnings:
        print("✓ No MCP-related files found or all MCP schemas and tools are valid!")
    else:
        validator.print_results()

    # Exit with appropriate code
    sys.exit(0 if is_valid else 1)


if __name__ == "__main__":
    main()
