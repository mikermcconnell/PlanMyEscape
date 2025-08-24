#!/bin/bash

# PlanMyEscape Checkpoint Management Script

case "$1" in
  create)
    # Create a new checkpoint with optional description
    DESC="${2:-Working state}"
    TAG_NAME="checkpoint-$(date +%Y%m%d-%H%M%S)"
    git add .
    git commit -m "Checkpoint: $DESC"
    git tag -a "$TAG_NAME" -m "$DESC"
    echo "✅ Created checkpoint: $TAG_NAME"
    echo "Description: $DESC"
    ;;
    
  list)
    # List all checkpoints
    echo "📋 Available checkpoints:"
    git tag -l "checkpoint-*" | sort -r | head -10
    ;;
    
  restore)
    # Restore to a specific checkpoint
    if [ -z "$2" ]; then
      echo "❌ Please specify a checkpoint name"
      echo "Usage: ./checkpoint.sh restore checkpoint-name"
      exit 1
    fi
    echo "⚠️  WARNING: This will discard all uncommitted changes!"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      git reset --hard "$2"
      echo "✅ Restored to checkpoint: $2"
    else
      echo "❌ Restore cancelled"
    fi
    ;;
    
  delete)
    # Delete a checkpoint
    if [ -z "$2" ]; then
      echo "❌ Please specify a checkpoint name"
      exit 1
    fi
    git tag -d "$2"
    echo "✅ Deleted checkpoint: $2"
    ;;
    
  *)
    echo "PlanMyEscape Checkpoint Manager"
    echo "================================"
    echo "Usage:"
    echo "  ./checkpoint.sh create [description]  - Create a new checkpoint"
    echo "  ./checkpoint.sh list                  - List recent checkpoints"
    echo "  ./checkpoint.sh restore <name>        - Restore to a checkpoint"
    echo "  ./checkpoint.sh delete <name>         - Delete a checkpoint"
    echo ""
    echo "Examples:"
    echo "  ./checkpoint.sh create 'Before adding payment feature'"
    echo "  ./checkpoint.sh restore checkpoint-20250824-084456"
    ;;
esac