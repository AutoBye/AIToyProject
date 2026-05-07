# AI Prompt Architecture

Prompts live in `backend/app/services/prompts.py`.

## Code Analysis

The code prompt establishes the model as a senior software engineer and asks for code smells, security vulnerabilities, complexity, refactoring, performance improvements, and improved code examples.

Expected sections:

- Overview
- Problems
- Severity
- Recommended Fixes
- Improved Code

## Log Analysis

The log prompt establishes the model as a backend reliability engineer and asks for root cause, critical errors, suspicious patterns, bottlenecks, simple explanation, fixes, and severity.

Expected sections:

- Summary
- Critical Issues
- Root Cause
- Recommendations
- Security Risks
- Performance Risks

## Production Controls

- Keep prompt templates versioned with `prompt_version`.
- Limit uploaded context length before model calls.
- Store model names and API keys in environment variables.
- Track usage in `token_usage`.
- Add secret redaction before model calls in regulated deployments.
