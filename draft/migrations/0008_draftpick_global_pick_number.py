# Generated by Django 3.1.3 on 2021-05-31 12:17

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("draft", "0007_draftsession_infinites"),
    ]

    operations = [
        migrations.AddField(
            model_name="draftpick",
            name="global_pick_number",
            field=models.PositiveSmallIntegerField(null=True),
        ),
    ]
