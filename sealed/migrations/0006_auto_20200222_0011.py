# Generated by Django 3.0.3 on 2020-02-22 00:11

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sealed', '0005_auto_20200213_1542'),
    ]

    operations = [
        migrations.AddField(
            model_name='sealedsession',
            name='finished_at',
            field=models.DateTimeField(null=True),
        ),
        migrations.AddField(
            model_name='sealedsession',
            name='playing_at',
            field=models.DateTimeField(null=True),
        ),
    ]
