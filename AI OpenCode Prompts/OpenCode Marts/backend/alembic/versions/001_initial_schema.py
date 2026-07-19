"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-06-21
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("role", sa.String(50), nullable=False, server_default="client"),
        sa.Column("locale", sa.String(10), nullable=False, server_default="en"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "agents",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("domain", sa.String(50), nullable=False, server_default="custom"),
        sa.Column("locale", sa.String(10), nullable=False, server_default="en"),
        sa.Column("system_prompt", sa.Text()),
        sa.Column("settings", JSONB(), server_default="{}"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_by", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "agent_training_data",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("agent_id", UUID(as_uuid=True), sa.ForeignKey("agents.id", ondelete="CASCADE"), nullable=False),
        sa.Column("file_type", sa.String(10), nullable=False),
        sa.Column("file_path", sa.String(500)),
        sa.Column("content_hash", sa.String(64)),
        sa.Column("content_text", sa.Text()),
        sa.Column("processed", sa.Boolean(), server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "customers",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255)),
        sa.Column("phone", sa.String(50)),
        sa.Column("email", sa.String(255)),
        sa.Column("metadata", JSONB(), server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "conversations",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("agent_id", UUID(as_uuid=True), sa.ForeignKey("agents.id"), nullable=False),
        sa.Column("customer_id", UUID(as_uuid=True), sa.ForeignKey("customers.id")),
        sa.Column("channel", sa.String(50), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column("metadata", JSONB(), server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("closed_at", sa.DateTime(timezone=True)),
    )

    op.create_table(
        "messages",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("conversation_id", UUID(as_uuid=True), sa.ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("metadata", JSONB(), server_default="{}"),
        sa.Column("tokens_used", sa.Integer()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "subscriptions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("customer_id", UUID(as_uuid=True), sa.ForeignKey("customers.id"), nullable=False),
        sa.Column("plan", sa.String(50), nullable=False, server_default="free"),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column("start_date", sa.Date()),
        sa.Column("end_date", sa.Date()),
        sa.Column("stripe_customer_id", sa.String(255)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "tickets",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("customer_id", UUID(as_uuid=True), sa.ForeignKey("customers.id"), nullable=False),
        sa.Column("assigned_to", UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("subject", sa.String(255), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("priority", sa.String(20), nullable=False, server_default="medium"),
        sa.Column("status", sa.String(20), nullable=False, server_default="open"),
        sa.Column("category", sa.String(100)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("resolved_at", sa.DateTime(timezone=True)),
    )

    op.create_table(
        "analytics_events",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("event_type", sa.String(100), nullable=False),
        sa.Column("entity_type", sa.String(50)),
        sa.Column("entity_id", UUID(as_uuid=True)),
        sa.Column("data", JSONB(), server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_analytics_events_entity", "analytics_events", ["entity_type", "entity_id", "created_at"])

    op.create_table(
        "cms_sites",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("platform", sa.String(50), nullable=False),
        sa.Column("domain", sa.String(255)),
        sa.Column("settings", JSONB(), server_default="{}"),
        sa.Column("seo_settings", JSONB(), server_default="{}"),
        sa.Column("created_by", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "cms_pages",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("site_id", UUID(as_uuid=True), sa.ForeignKey("cms_sites.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(255), nullable=False),
        sa.Column("content", JSONB(), server_default="{}"),
        sa.Column("seo_meta", JSONB(), server_default="{}"),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("published_at", sa.DateTime(timezone=True)),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "automation_rules",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("trigger", sa.String(50), nullable=False),
        sa.Column("conditions", JSONB(), server_default="{}"),
        sa.Column("actions", JSONB(), server_default="{}"),
        sa.Column("is_active", sa.Boolean(), server_default="true"),
        sa.Column("created_by", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "inbox_messages",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("channel", sa.String(50), nullable=False),
        sa.Column("channel_message_id", sa.String(255)),
        sa.Column("customer_id", UUID(as_uuid=True), sa.ForeignKey("customers.id")),
        sa.Column("direction", sa.String(10), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("metadata", JSONB(), server_default="{}"),
        sa.Column("is_read", sa.Boolean(), server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table("inbox_messages")
    op.drop_table("automation_rules")
    op.drop_table("cms_pages")
    op.drop_table("cms_sites")
    op.drop_table("analytics_events")
    op.drop_table("tickets")
    op.drop_table("subscriptions")
    op.drop_table("messages")
    op.drop_table("conversations")
    op.drop_table("customers")
    op.drop_table("agent_training_data")
    op.drop_table("agents")
    op.drop_table("users")
