# Generated by Django 3.1.3 on 2021-05-10 13:21

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("limited", "0019_pooldeck_latest"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="matchresult",
            name="session",
        ),
        migrations.DeleteModel(
            name="MatchPlayer",
        ),
        migrations.DeleteModel(
            name="MatchResult",
        ),
    ]
