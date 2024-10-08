# Generated by Django 3.1.3 on 2020-12-16 13:45

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tournaments", "0001_initial"),
        ("limited", "0014_auto_20201214_1520"),
    ]

    operations = [
        migrations.AddField(
            model_name="limitedsession",
            name="tournament",
            field=models.OneToOneField(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="tournament",
                to="tournaments.tournament",
            ),
        ),
    ]
