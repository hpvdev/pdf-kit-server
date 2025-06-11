#!/bin/bash

# PDF Kit Server Deployment Script
# Usage: ./scripts/deploy.sh [environment]
# Environments: development, staging, production

set -e

# Configuration
ENVIRONMENT=${1:-production}
PROJECT_NAME="pdf-kit-server"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    log_success "Docker is running"
}

# Check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose and try again."
        exit 1
    fi
    log_success "Docker Compose is available"
}

# Create necessary directories
create_directories() {
    log_info "Creating necessary directories..."
    mkdir -p logs
    mkdir -p logs/nginx
    mkdir -p ssl
    mkdir -p monitoring/grafana/dashboards
    mkdir -p monitoring/grafana/datasources
    log_success "Directories created"
}

# Build the application
build_application() {
    log_info "Building the application..."
    npm run build
    log_success "Application built successfully"
}

# Build Docker images
build_docker_images() {
    log_info "Building Docker images..."
    docker-compose -f $DOCKER_COMPOSE_FILE build --no-cache
    log_success "Docker images built successfully"
}

# Deploy the application
deploy_application() {
    log_info "Deploying the application..."
    
    # Stop existing containers
    docker-compose -f $DOCKER_COMPOSE_FILE down
    
    # Start new containers
    docker-compose -f $DOCKER_COMPOSE_FILE up -d
    
    log_success "Application deployed successfully"
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    # Wait for services to start
    sleep 30
    
    # Check if the main service is healthy
    if curl -f http://localhost/api/v1/health > /dev/null 2>&1; then
        log_success "Health check passed"
    else
        log_warning "Health check failed, but services might still be starting up"
        log_info "You can check the status with: docker-compose -f $DOCKER_COMPOSE_FILE ps"
    fi
}

# Show deployment status
show_status() {
    log_info "Deployment Status:"
    docker-compose -f $DOCKER_COMPOSE_FILE ps
    
    echo ""
    log_info "Service URLs:"
    echo "  - PDF Kit Server: http://localhost/api/v1"
    echo "  - Health Check: http://localhost/api/v1/health"
    echo "  - Prometheus: http://localhost:9090"
    echo "  - Grafana: http://localhost:3001 (admin/admin123)"
    
    echo ""
    log_info "Logs can be viewed with:"
    echo "  docker-compose -f $DOCKER_COMPOSE_FILE logs -f [service_name]"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up old Docker images..."
    docker image prune -f
    log_success "Cleanup completed"
}

# Main deployment function
main() {
    log_info "Starting deployment for environment: $ENVIRONMENT"
    
    # Pre-deployment checks
    check_docker
    check_docker_compose
    
    # Prepare environment
    create_directories
    
    # Build and deploy
    build_application
    build_docker_images
    deploy_application
    
    # Post-deployment
    health_check
    show_status
    cleanup
    
    log_success "Deployment completed successfully!"
    log_info "Monitor the application with: docker-compose -f $DOCKER_COMPOSE_FILE logs -f"
}

# Handle script arguments
case $ENVIRONMENT in
    development|staging|production)
        main
        ;;
    *)
        log_error "Invalid environment: $ENVIRONMENT"
        log_info "Usage: $0 [development|staging|production]"
        exit 1
        ;;
esac
