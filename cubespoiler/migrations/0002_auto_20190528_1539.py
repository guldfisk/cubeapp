# Generated by Django 2.2.1 on 2019-05-28 15:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cubespoiler', '0001_initial'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='cubecontainer',
            options={'ordering': ('-created_at',)},
        ),
        migrations.AddField(
            model_name='cubecontainer',
            name='name',
            field=models.CharField(default='haha', max_length=64),
            preserve_default=False,
        ),
    ]
