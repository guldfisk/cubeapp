# Generated by Django 2.2.5 on 2019-10-07 12:47

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_auto_20191007_0945'),
    ]

    operations = [
        migrations.RenameField(
            model_name='cubepatch',
            old_name='content',
            new_name='patch',
        ),
    ]