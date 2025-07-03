#!/usr/bin/env python3
"""
HPS Monorepo Structure Setup Script
This script creates the folder structure and empty files for the monorepo
"""

import os
from pathlib import Path
import sys

class MonorepoStructureSetup:
    def __init__(self, root_path="."):
        self.root_path = Path(root_path)
        self.created_items = []
        
    def create_directory(self, path):
        """Create directory if it doesn't exist"""
        full_path = self.root_path / path
        full_path.mkdir(parents=True, exist_ok=True)
        self.created_items.append(f"📁 {path}/")
        
    def create_file(self, path):
        """Create empty file"""
        full_path = self.root_path / path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        full_path.touch()
        self.created_items.append(f"📄 {path}")
    
    def setup_structure(self):
        """Create the complete monorepo structure"""
        
        print("🚀 Setting up HPS monorepo structure...\n")
        
        # Root directories
        root_dirs = [
            ".github/workflows",
            ".github/ISSUE_TEMPLATE",
            ".husky",
            ".vscode",
            "apps",
            "services",
            "packages",
            "infrastructure/docker",
            "infrastructure/kubernetes",
            "infrastructure/terraform",
            "infrastructure/scripts",
            "docs/architecture/decisions",
            "docs/api/openapi",
            "docs/guides",
            "docs/templates",
            "tools/generators/service",
            "tools/generators/feature",
            "tools/migrations",
            "tools/scripts"
        ]
        
        for dir_path in root_dirs:
            self.create_directory(dir_path)
        
        # Root files
        root_files = [
            "package.json",
            "pnpm-workspace.yaml",
            "turbo.json",
            ".gitignore",
            ".npmrc",
            ".prettierrc.js",
            ".prettierignore",
            "commitlint.config.js",
            ".lintstagedrc.js",
            "tsconfig.json",
            "README.md",
            "LICENSE",
            ".env.example",
            "docker-compose.yml",
            "docker-compose.prod.yml",
            "docker-compose.test.yml",
            "plopfile.js"
        ]
        
        for file_path in root_files:
            self.create_file(file_path)
        
        # GitHub files
        github_files = [
            ".github/workflows/ci.yml",
            ".github/workflows/deploy.yml",
            ".github/PULL_REQUEST_TEMPLATE.md",
            ".github/ISSUE_TEMPLATE/bug_report.md",
            ".github/ISSUE_TEMPLATE/feature_request.md",
            ".github/CODEOWNERS",
            ".github/dependabot.yml"
        ]
        
        for file_path in github_files:
            self.create_file(file_path)
        
        # VS Code files
        vscode_files = [
            ".vscode/settings.json",
            ".vscode/extensions.json",
            ".vscode/launch.json",
            ".vscode/tasks.json"
        ]
        
        for file_path in vscode_files:
            self.create_file(file_path)
        
        # Husky hooks
        husky_files = [
            ".husky/pre-commit",
            ".husky/commit-msg",
            ".husky/pre-push"
        ]
        
        for file_path in husky_files:
            self.create_file(file_path)
        
        # Service structure (auth-service as example)
        self.setup_service("auth-service")
        
        # Additional services (empty structure)
        services = [
            "user-service",
            "payment-service",
            "academic-service",
            "notification-service"
        ]
        
        for service in services:
            self.create_directory(f"services/{service}")
            self.create_file(f"services/{service}/.gitkeep")
        
        # Shared service utilities
        self.create_directory("services/shared")
        self.create_file("services/shared/.gitkeep")
        
        # Web app structure
        self.setup_web_app()
        
        # Packages structure
        self.setup_packages()
        
        # Documentation files
        self.setup_docs()
        
        # Infrastructure files
        infrastructure_files = [
            "infrastructure/docker/Dockerfile.node",
            "infrastructure/docker/docker-compose.base.yml",
            "infrastructure/scripts/backup.sh",
            "infrastructure/scripts/deploy.sh",
            "infrastructure/scripts/health-check.sh"
        ]
        
        for file_path in infrastructure_files:
            self.create_file(file_path)
        
        # Tool files
        tool_files = [
            "tools/generators/service/package.json.hbs",
            "tools/generators/service/tsconfig.json.hbs",
            "tools/generators/service/README.md.hbs",
            "tools/generators/service/.env.example.hbs",
            "tools/generators/feature/index.ts.hbs",
            "tools/generators/feature/components/index.ts.hbs",
            "tools/generators/feature/hooks/index.ts.hbs",
            "tools/generators/feature/types/index.ts.hbs",
            "tools/scripts/setup-dev.sh",
            "tools/scripts/clean.sh",
            "tools/scripts/generate-types.sh"
        ]
        
        for file_path in tool_files:
            self.create_file(file_path)
        
        print("\n✅ Monorepo structure created successfully!")
        print(f"\n📊 Created {len(self.created_items)} items:")
        print(f"   - Directories: {sum(1 for item in self.created_items if '📁' in item)}")
        print(f"   - Files: {sum(1 for item in self.created_items if '📄' in item)}")
        
    def setup_service(self, service_name):
        """Setup a service structure"""
        base_path = f"services/{service_name}"
        
        # Service directories
        service_dirs = [
            "src/config",
            "src/controllers",
            "src/services",
            "src/models",
            "src/routes",
            "src/middlewares",
            "src/validators",
            "src/utils",
            "src/types",
            "src/tests/unit",
            "src/tests/integration",
            "src/tests/fixtures"
        ]
        
        for dir_path in service_dirs:
            self.create_directory(f"{base_path}/{dir_path}")
        
        # Service files
        service_files = [
            "package.json",
            "tsconfig.json",
            "jest.config.js",
            ".env.example",
            "README.md",
            "Dockerfile",
            ".dockerignore",
            ".eslintrc.js",
            "src/server.ts",
            "src/app.ts",
            "src/index.ts",
            "src/config/index.ts",
            "src/config/database.ts",
            "src/config/redis.ts",
            "src/config/constants.ts",
            "src/middlewares/error.middleware.ts",
            "src/middlewares/auth.middleware.ts",
            "src/middlewares/validation.middleware.ts",
            "src/utils/logger.ts",
            "src/utils/helpers.ts",
            "src/types/index.ts"
        ]
        
        for file_path in service_files:
            self.create_file(f"{base_path}/{file_path}")
    
    def setup_web_app(self):
        """Setup web application structure"""
        base_path = "apps/web"
        
        # Web app directories
        web_dirs = [
            "public/images",
            "public/fonts",
            "public/locales",
            "src/app/layouts",
            "src/app/providers",
            "src/app/router",
            "src/app/store",
            "src/features/auth/components",
            "src/features/auth/hooks",
            "src/features/auth/pages",
            "src/features/auth/services",
            "src/features/auth/stores",
            "src/features/auth/types",
            "src/features/dashboard/components",
            "src/features/dashboard/pages",
            "src/features/students/components",
            "src/features/students/pages",
            "src/features/employees/components",
            "src/features/employees/pages",
            "src/features/payments/components",
            "src/features/payments/pages",
            "src/shared/components/ui",
            "src/shared/components/layout",
            "src/shared/hooks",
            "src/shared/services",
            "src/shared/utils",
            "src/shared/types",
            "src/styles",
            "src/tests/unit",
            "src/tests/integration",
            "src/tests/e2e"
        ]
        
        for dir_path in web_dirs:
            self.create_directory(f"{base_path}/{dir_path}")
        
        # Web app files
        web_files = [
            "package.json",
            "tsconfig.json",
            "tsconfig.node.json",
            "vite.config.ts",
            "vitest.config.ts",
            "tailwind.config.js",
            "postcss.config.js",
            ".env.example",
            "index.html",
            ".eslintrc.js",
            "README.md",
            "src/main.tsx",
            "src/vite-env.d.ts",
            "src/app/App.tsx",
            "src/app/theme.ts",
            "src/styles/globals.css",
            "src/styles/variables.css",
            "public/favicon.ico",
            "public/robots.txt",
            "public/manifest.json"
        ]
        
        for file_path in web_files:
            self.create_file(f"{base_path}/{file_path}")
    
    def setup_packages(self):
        """Setup shared packages structure"""
        
        # Package directories and their files
        packages = {
            "config-eslint": [
                "index.js",
                "package.json",
                "README.md"
            ],
            "config-typescript": [
                "base.json",
                "node.json",
                "react.json",
                "package.json",
                "README.md"
            ],
            "ui-components": [
                "src/index.ts",
                "src/Button/Button.tsx",
                "src/Button/Button.test.tsx",
                "src/Button/index.ts",
                "package.json",
                "tsconfig.json",
                "README.md",
                ".storybook/main.js",
                ".storybook/preview.js"
            ],
            "utils": [
                "src/index.ts",
                "src/logger/index.ts",
                "src/validators/index.ts",
                "src/helpers/index.ts",
                "package.json",
                "tsconfig.json",
                "jest.config.js",
                "README.md"
            ],
            "types": [
                "src/index.ts",
                "src/user.types.ts",
                "src/auth.types.ts",
                "src/common.types.ts",
                "package.json",
                "tsconfig.json",
                "README.md"
            ],
            "api-client": [
                "src/index.ts",
                "src/generated/.gitkeep",
                "package.json",
                "tsconfig.json",
                "README.md"
            ]
        }
        
        for package_name, files in packages.items():
            base_path = f"packages/{package_name}"
            for file_path in files:
                self.create_file(f"{base_path}/{file_path}")
    
    def setup_docs(self):
        """Setup documentation structure"""
        
        doc_files = [
            "docs/README.md",
            "docs/architecture/README.md",
            "docs/architecture/system-design.md",
            "docs/architecture/database-design.md",
            "docs/architecture/api-design.md",
            "docs/architecture/decisions/README.md",
            "docs/architecture/decisions/adr-001-monorepo.md",
            "docs/architecture/decisions/adr-002-typescript.md",
            "docs/architecture/decisions/adr-003-microservices.md",
            "docs/api/README.md",
            "docs/api/auth-service.md",
            "docs/api/user-service.md",
            "docs/api/payment-service.md",
            "docs/api/academic-service.md",
            "docs/api/openapi/auth-service.yaml",
            "docs/api/openapi/user-service.yaml",
            "docs/guides/getting-started.md",
            "docs/guides/development.md",
            "docs/guides/deployment.md",
            "docs/guides/testing.md",
            "docs/guides/contributing.md",
            "docs/guides/troubleshooting.md",
            "docs/templates/adr-template.md",
            "docs/templates/api-template.md",
            "docs/templates/service-readme.md"
        ]
        
        for file_path in doc_files:
            self.create_file(file_path)

def main():
    """Main function to run the setup"""
    
    # Check if a custom path is provided
    root_path = sys.argv[1] if len(sys.argv) > 1 else "hafeez-public-school"
    
    # Create the root directory if it doesn't exist
    Path(root_path).mkdir(exist_ok=True)
    
    # Setup the structure
    setup = MonorepoStructureSetup(root_path)
    setup.setup_structure()
    
    print(f"\n📍 Project created at: {Path(root_path).absolute()}")
    print("\n🎯 Next steps:")
    print("   1. cd " + root_path)
    print("   2. git init")
    print("   3. pnpm install")
    print("   4. Start adding your code!")

if __name__ == "__main__":
    main()