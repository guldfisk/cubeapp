# Generated by Django 3.1.3 on 2021-09-28 11:13

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('kpd', '0003_auto_20210909_1333'),
    ]

    operations = [
        migrations.RenameModel('KebabPoint', 'LogPoint'),
    ]