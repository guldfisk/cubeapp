# Generated by Django 3.1.3 on 2020-12-14 15:20

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0018_passwordreset'),
    ]

    operations = [
        migrations.AlterField(
            model_name='distributionpossibility',
            name='patch',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='distribution_possibilities', to='api.cubepatch'),
        ),
    ]
