# Generated by Django 3.2.25 on 2024-09-20 13:01

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0023_eeerror"),
    ]

    operations = [
        migrations.AddField(
            model_name="versionedcube",
            name="featured",
            field=models.BooleanField(default=True),
        ),
    ]