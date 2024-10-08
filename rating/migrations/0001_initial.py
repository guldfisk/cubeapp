# Generated by Django 3.0.5 on 2020-04-12 22:39

import django.db.models.deletion
from django.db import migrations, models

import api.fields.orp


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("api", "0014_auto_20200406_1240"),
    ]

    operations = [
        migrations.CreateModel(
            name="RatingMap",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "release",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="rating_maps", to="api.CubeRelease"
                    ),
                ),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="CubeableRating",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("cubeable_id", models.CharField(max_length=511)),
                ("cubeable", api.fields.orp.CubeableField()),
                ("rating", models.PositiveSmallIntegerField()),
                (
                    "rating_map",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="ratings", to="rating.RatingMap"
                    ),
                ),
            ],
        ),
    ]
