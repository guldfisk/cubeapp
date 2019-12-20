# Generated by Django 3.0 on 2019-12-13 13:56

import api.fields.orp
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('api', '0013_auto_20191126_1452'),
    ]

    operations = [
        migrations.CreateModel(
            name='SealedSession',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('pool_size', models.PositiveSmallIntegerField()),
                ('release', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sealed_sessions', to='api.CubeRelease')),
            ],
        ),
        migrations.CreateModel(
            name='Pool',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('pool', api.fields.orp.OrpField(model_type='magiccube.collections.cube.Cube')),
                ('key', models.CharField(max_length=63)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sealed_pools', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]