# Generated by Django 2.2.5 on 2019-10-07 14:36

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0009_auto_20191007_1411'),
    ]

    operations = [
        migrations.RenameField(
            model_name='distributionpossibility',
            old_name='content',
            new_name='trap_collection',
        ),
    ]