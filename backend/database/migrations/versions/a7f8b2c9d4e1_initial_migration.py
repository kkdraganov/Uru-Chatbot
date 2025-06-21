"""Initial migration - create users, conversations, and messages tables

Revision ID: a7f8b2c9d4e1
Revises:
Create Date: 2025-06-19 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a7f8b2c9d4e1'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - migrate existing users table and create conversations/messages tables."""

    # Check if users table exists and has old schema
    connection = op.get_bind()
    inspector = sa.inspect(connection)

    if 'users' in inspector.get_table_names():
        # Table exists, check if it has old schema
        columns = {col['name']: col for col in inspector.get_columns('users')}

        if 'hashed_password' in columns:
            # Old schema detected, migrate it
            print("Migrating existing users table from old schema...")

            # Add new columns
            op.add_column('users', sa.Column('password_hash', sa.String(length=255), nullable=True))
            op.add_column('users', sa.Column('name', sa.String(length=255), nullable=True))
            op.add_column('users', sa.Column('preferences', sa.JSON(), nullable=True))

            # Migrate data
            op.execute("""
                UPDATE users SET
                    password_hash = hashed_password,
                    name = COALESCE(first_name || ' ' || last_name, first_name, last_name, email)
                WHERE password_hash IS NULL
            """)

            # Make new columns non-nullable
            op.alter_column('users', 'password_hash', nullable=False)
            op.alter_column('users', 'name', nullable=False)

            # Drop old columns
            op.drop_column('users', 'hashed_password')
            op.drop_column('users', 'first_name')
            op.drop_column('users', 'last_name')
            op.drop_column('users', 'role')
            op.drop_column('users', 'is_verified')

            # Create the case-insensitive email index if it doesn't exist
            existing_indexes = [idx['name'] for idx in inspector.get_indexes('users')]
            if 'ix_users_email_lower' not in existing_indexes:
                # Drop old email index if it exists
                if 'ix_users_email' in existing_indexes:
                    op.drop_index('ix_users_email', table_name='users')
                op.create_index('ix_users_email_lower', 'users', [sa.text('LOWER(email)')], unique=True)
        else:
            print("Users table already has new schema, skipping migration...")
    else:
        # Create users table from scratch
        print("Creating users table from scratch...")
        op.create_table('users',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('email', sa.String(length=255), nullable=False),
            sa.Column('password_hash', sa.String(length=255), nullable=False),
            sa.Column('name', sa.String(length=255), nullable=False),
            sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
            sa.Column('preferences', sa.JSON(), nullable=True),
            sa.Column('last_login', sa.DateTime(timezone=True), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
        # Create case-insensitive unique index for email using PostgreSQL's LOWER() function
        op.create_index('ix_users_email_lower', 'users', [sa.text('LOWER(email)')], unique=True)
    
    # Create conversations table
    op.create_table('conversations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('ai_model', sa.String(length=100), nullable=False),
        sa.Column('system_prompt', sa.Text(), nullable=True),
        sa.Column('is_archived', sa.Boolean(), nullable=False, default=False),
        sa.Column('is_pinned', sa.Boolean(), nullable=False, default=False),
        sa.Column('last_message_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_conversations_id'), 'conversations', ['id'], unique=False)
    
    # Create messages table
    op.create_table('messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('conversation_id', sa.Integer(), nullable=False),
        sa.Column('sender', sa.String(length=20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('content_hash', sa.String(length=64), nullable=True),
        sa.Column('ai_model', sa.String(length=100), nullable=True),
        sa.Column('is_error', sa.Boolean(), nullable=False, default=False),
        sa.Column('error_details', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_messages_id'), 'messages', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema - drop all tables."""

    # Drop messages table if it exists
    connection = op.get_bind()
    inspector = sa.inspect(connection)

    if 'messages' in inspector.get_table_names():
        op.drop_index(op.f('ix_messages_id'), table_name='messages')
        op.drop_table('messages')

    # Drop conversations table if it exists
    if 'conversations' in inspector.get_table_names():
        op.drop_index(op.f('ix_conversations_id'), table_name='conversations')
        op.drop_table('conversations')

    # Drop users table if it exists
    if 'users' in inspector.get_table_names():
        existing_indexes = [idx['name'] for idx in inspector.get_indexes('users')]
        if 'ix_users_email_lower' in existing_indexes:
            op.drop_index('ix_users_email_lower', table_name='users')
        if 'ix_users_id' in existing_indexes:
            op.drop_index(op.f('ix_users_id'), table_name='users')
        op.drop_table('users')
