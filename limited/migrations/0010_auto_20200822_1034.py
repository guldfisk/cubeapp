# Generated by Django 3.1 on 2020-08-22 10:34

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("limited", "0009_boosterspecification_scale"),
    ]

    operations = [
        migrations.CreateModel(
            name="ChaosBoosterSpecification",
            fields=[],
            options={
                "proxy": True,
                "indexes": [],
                "constraints": [],
            },
            bases=("limited.boosterspecification",),
        ),
        migrations.AddField(
            model_name="boosterspecification",
            name="same",
            field=models.BooleanField(null=True),
        ),
        migrations.AlterField(
            model_name="boosterspecification",
            name="type",
            field=models.CharField(
                choices=[
                    ("limited.expansionboosterspecification", "expansion booster specification"),
                    ("limited.chaosboosterspecification", "chaos booster specification"),
                    ("limited.allcardsboosterspecification", "all cards booster specification"),
                    ("limited.cubeboosterspecification", "cube booster specification"),
                ],
                db_index=True,
                max_length=255,
            ),
        ),
    ]
