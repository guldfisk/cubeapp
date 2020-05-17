# Generated by Django 3.0.5 on 2020-05-04 10:23

from django.db import migrations, models
import django.db.models.deletion
import utils.fields


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0014_auto_20200406_1240'),
    ]

    operations = [
        migrations.CreateModel(
            name='ReleaseImageBundle',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('url', models.CharField(max_length=511)),
                ('target', utils.fields.EnumField(enum_type='api.models.Target')),
                ('release', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='image_bundles', to='api.CubeRelease')),
            ],
            options={
                'unique_together': {('release', 'target')},
            },
        ),
    ]