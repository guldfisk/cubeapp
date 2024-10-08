# Generated by Django 3.0.3 on 2020-03-04 15:52

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import api.fields.orp
import limited.models
import utils.fields
import utils.methods


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("api", "0013_auto_20191126_1452"),
    ]

    operations = [
        migrations.CreateModel(
            name="LimitedSession",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("playing_at", models.DateTimeField(null=True)),
                ("finished_at", models.DateTimeField(null=True)),
                ("name", models.CharField(default=utils.methods.get_random_name, max_length=255)),
                (
                    "state",
                    utils.fields.EnumField(
                        default=limited.models.LimitedSession.LimitedSessionState["DECK_BUILDING"],
                        enum_type="limited.models.LimitedSessionState",
                    ),
                ),
                ("format", models.CharField(max_length=255)),
                ("game_type", models.CharField(max_length=255)),
                ("open_decks", models.BooleanField()),
            ],
        ),
        migrations.CreateModel(
            name="Pool",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("pool", api.fields.orp.OrpField(model_type="magiccube.collections.cube.Cube")),
                (
                    "session",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="pools", to="limited.LimitedSession"
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="sealed_pools",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "unique_together": {("session", "user")},
            },
        ),
        migrations.CreateModel(
            name="PoolSpecification",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
            ],
        ),
        migrations.CreateModel(
            name="PoolDeck",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("name", models.CharField(max_length=255)),
                ("deck", api.fields.orp.OrpField(model_type="mtgorp.models.collections.deck.Deck")),
                (
                    "pool",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="deck", to="limited.Pool"
                    ),
                ),
            ],
        ),
        migrations.AddField(
            model_name="limitedsession",
            name="pool_specification",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE, related_name="sessions", to="limited.PoolSpecification"
            ),
        ),
        migrations.CreateModel(
            name="BoosterSpecification",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "type",
                    models.CharField(
                        choices=[
                            ("limited.expansionboosterspecification", "expansion booster specification"),
                            (
                                "limited.allcardsrespectrarityboosterspecification",
                                "all cards respect rarity booster specification",
                            ),
                            ("limited.cubeboosterspecification", "cube booster specification"),
                        ],
                        db_index=True,
                        max_length=255,
                    ),
                ),
                ("sequence_number", models.IntegerField()),
                ("expansion_code", models.CharField(max_length=15, null=True)),
                ("size", models.PositiveSmallIntegerField(null=True)),
                ("allow_intersection", models.BooleanField(default=False, null=True)),
                ("allow_repeat", models.BooleanField(default=False, null=True)),
                (
                    "release",
                    models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, to="api.CubeRelease"),
                ),
                (
                    "pool_specification",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.DO_NOTHING,
                        related_name="specifications",
                        to="limited.PoolSpecification",
                    ),
                ),
            ],
            options={
                "ordering": ("sequence_number",),
            },
        ),
        migrations.CreateModel(
            name="AllCardsRespectRarityBoosterSpecification",
            fields=[],
            options={
                "proxy": True,
                "indexes": [],
                "constraints": [],
            },
            bases=("limited.boosterspecification",),
        ),
        migrations.CreateModel(
            name="CubeBoosterSpecification",
            fields=[],
            options={
                "proxy": True,
                "indexes": [],
                "constraints": [],
            },
            bases=("limited.boosterspecification",),
        ),
        migrations.CreateModel(
            name="ExpansionBoosterSpecification",
            fields=[],
            options={
                "proxy": True,
                "indexes": [],
                "constraints": [],
            },
            bases=("limited.boosterspecification",),
        ),
        migrations.RunSQL(
            """
            alter table limited_boosterspecification
            add constraint pool_specification_id_constraint
            foreign key (pool_specification_id)
            REFERENCES limited_poolspecification(id)
            on delete cascade;
            """
        ),
    ]
