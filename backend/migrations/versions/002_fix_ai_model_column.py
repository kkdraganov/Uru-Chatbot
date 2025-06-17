"""Fix ai_model column name in messages table

Revision ID: 002_fix_ai_model_column
Revises: 001_enhanced_models
Create Date: 2025-06-17 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '002_fix_ai_model_column'
down_revision: Union[str, None] = '001_enhanced_models'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Rename model_used column to ai_model to match SQLAlchemy model
    op.alter_column('messages', 'model_used', new_column_name='ai_model')
    
    # Also rename metadata column to message_metadata to match SQLAlchemy model
    op.alter_column('messages', 'metadata', new_column_name='message_metadata')


def downgrade() -> None:
    """Downgrade schema."""
    # Revert column names back to original
    op.alter_column('messages', 'ai_model', new_column_name='model_used')
    op.alter_column('messages', 'message_metadata', new_column_name='metadata')
