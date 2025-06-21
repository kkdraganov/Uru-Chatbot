# Pre-commit Validation Setup

This document describes the comprehensive pre-commit validation setup for the Uru Chatbot project, ensuring code quality, security, and consistency across all contributions.

## Overview

The pre-commit setup includes:

- **Python**: Ruff (linting + formatting), MyPy (type checking), Bandit (security)
- **Frontend**: ESLint (linting), Prettier (formatting), TypeScript validation
- **Custom**: MCP tool validation, environment file checking
- **Docker**: Hadolint validation for Dockerfiles
- **CI/CD**: Automated checks on all PRs and pushes
- **Security**: Vulnerability scanning with Trivy and Bandit

## Quick Setup

### Windows Setup (Recommended)

Due to PowerShell execution policy restrictions, use these manual steps:

1. **Install Python dependencies:**
   ```cmd
   cd backend
   pip install -r requirements-dev.txt
   cd ..
   ```

2. **Install Node.js dependencies:**
   ```cmd
   cd frontend
   npm install
   cd ..
   ```

3. **Install pre-commit hooks:**
   ```cmd
   pip install pre-commit
   pre-commit install
   ```

4. **Test the setup:**
   ```cmd
   pre-commit run --all-files
   ```

### Linux/Mac Setup

```bash
# Make setup script executable and run it
chmod +x scripts/setup_precommit.sh
./scripts/setup_precommit.sh
```

## Configuration Files

### Core Configuration
- `.pre-commit-config.yaml` - Main pre-commit configuration
- `pyproject.toml` - Python tool configuration (Ruff, MyPy, Bandit, pytest)
- `.prettierrc.js` - Code formatting rules for JavaScript/TypeScript/JSON/YAML
- `frontend/eslint.config.js` - Updated ESLint configuration

### Development Environment
- `.vscode/extensions.json` - Recommended VS Code extensions
- `.vscode/settings.json` - VS Code settings for consistent development
- `backend/requirements-dev.txt` - Python development dependencies

### CI/CD
- `.github/workflows/quality-checks.yml` - Automated quality checks pipeline

### Custom Scripts
- `scripts/validate_mcp_schemas.py` - MCP tool structure and JSON schema validation
- `scripts/validate_env_files.sh` - Environment file validation
- `scripts/setup_precommit.sh` - Automated setup script
- `scripts/test_precommit.py` - Pre-commit hook testing script

## Available Hooks

### Python Hooks
- **Ruff**: Fast Python linter and formatter
- **MyPy**: Static type checking
- **Bandit**: Security vulnerability scanning

### Frontend Hooks
- **ESLint**: JavaScript/TypeScript linting with React rules
- **Prettier**: Code formatting
- **TypeScript**: Type checking

### Docker Hooks
- **Hadolint**: Dockerfile linting and best practices

### Security Hooks
- **Trivy**: Vulnerability scanning (manual stage)
- **Bandit**: Python security scanning

### Custom Hooks
- **MCP Schema Validation**: Validates MCP tool schemas and structures
- **Environment File Validation**: Checks .env files for security issues
- **Database Migration Validation**: Validates Alembic migrations

### General Hooks
- Trailing whitespace removal
- End-of-file fixing
- YAML/JSON/TOML validation
- Merge conflict detection
- Large file detection
- Private key detection

## Usage

### Daily Development

Pre-commit hooks run automatically on `git commit`. If hooks fail:

```bash
# Fix the issues and commit again
git add .
git commit -m "Your commit message"
```

### Manual Execution

```bash
# Run all hooks on all files
pre-commit run --all-files

# Run specific hook
pre-commit run ruff
pre-commit run eslint
pre-commit run prettier

# Run hooks on specific files
pre-commit run --files backend/app/main.py
```

### Skip Hooks (Use Sparingly)

```bash
# Skip all hooks for emergency commits
git commit --no-verify -m "Emergency fix"

# Skip specific hook
SKIP=ruff git commit -m "Skip ruff for this commit"
```

### Update Hooks

```bash
# Update all hooks to latest versions
pre-commit autoupdate

# Clean cached repositories
pre-commit clean
```

## Testing the Setup

Run the comprehensive test suite:

```bash
python scripts/test_precommit.py
```

This will:
- Test all configured hooks
- Create temporary files with intentional issues
- Verify hooks catch and fix problems correctly
- Provide a detailed report

## CI/CD Integration

The GitHub Actions workflow (`.github/workflows/quality-checks.yml`) runs:

1. **Python Quality Checks**: Ruff, MyPy, Bandit
2. **Frontend Quality Checks**: ESLint, Prettier, TypeScript, Build
3. **Docker Quality Checks**: Hadolint on all Dockerfiles
4. **Security Scanning**: Trivy, npm audit, Python safety
5. **Custom Validations**: MCP schemas, environment files
6. **Database Checks**: Migration validation
7. **Test Suite**: Full test execution with coverage

## Troubleshooting

### Common Issues

1. **Windows PowerShell Execution Policy Error**
   ```powershell
   # Run as Administrator and execute:
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

   # Or use Command Prompt instead of PowerShell
   # Or run individual commands instead of npm scripts
   ```

2. **Hook fails with "command not found"**
   ```bash
   # Reinstall pre-commit environment
   pre-commit clean
   pre-commit install
   ```

3. **Python hooks fail**
   ```bash
   # Ensure Python dependencies are installed
   cd backend
   pip install -r requirements-dev.txt
   ```

4. **Frontend hooks fail**
   ```bash
   # Ensure Node.js dependencies are installed
   cd frontend
   npm install
   ```

5. **ESLint dependency conflicts**
   ```bash
   # Clear npm cache and reinstall
   cd frontend
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

6. **Slow hook execution**
   ```bash
   # Run hooks in parallel (if supported)
   pre-commit run --all-files --parallel
   ```

### VS Code Integration

Install recommended extensions from `.vscode/extensions.json`:

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "@recommended"
4. Install all recommended extensions

The workspace settings in `.vscode/settings.json` will automatically configure:
- Ruff as Python formatter
- ESLint and Prettier for frontend
- Format on save
- Proper file associations

## Configuration Details

### Ruff Configuration (pyproject.toml)

```toml
[tool.ruff]
target-version = "py311"
line-length = 88
select = ["E", "W", "F", "I", "B", "C4", "UP", "ARG", "SIM", "TCH", "PTH", "ERA", "PL", "RUF"]
```

### ESLint Configuration (frontend/eslint.config.js)

- Next.js core web vitals
- React hooks rules
- TypeScript support
- Import ordering
- Accessibility rules

### Prettier Configuration (.prettierrc.js)

- Single quotes for JS/TS
- Double quotes for JSX
- Trailing commas
- Import sorting

## Security Considerations

The setup includes multiple security layers:

1. **Bandit**: Scans Python code for security vulnerabilities
2. **Trivy**: Scans for known vulnerabilities in dependencies
3. **Private Key Detection**: Prevents committing secrets
4. **Environment File Validation**: Checks for exposed secrets in .env files

## Performance

- **Ruff**: Extremely fast Python linting and formatting
- **Parallel Execution**: Hooks run in parallel where possible
- **Caching**: Pre-commit caches hook environments
- **Incremental**: Only runs on changed files by default

## Contributing

When contributing to this project:

1. Ensure pre-commit hooks are installed
2. All hooks must pass before committing
3. Add new validation rules to `.pre-commit-config.yaml` if needed
4. Update this documentation for any configuration changes

## Support

For issues with the pre-commit setup:

1. Check this documentation
2. Run `python scripts/test_precommit.py` to diagnose issues
3. Review GitHub Actions logs for CI failures
4. Consult the [pre-commit documentation](https://pre-commit.com/)

---

This setup ensures consistent, high-quality code across the entire Uru Chatbot project while maintaining developer productivity and security standards.
