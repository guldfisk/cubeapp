# Generated by Django 3.1.3 on 2020-12-18 12:21

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('tournaments', '0003_auto_20201218_1221'),
        ('limited', '0016_auto_20201218_1004'),
    ]

    operations = [
        migrations.AlterField(
            model_name='limitedsession',
            name='tournament',
            field=models.OneToOneField(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='limited_session', to='tournaments.tournament'),
        ),
    ]