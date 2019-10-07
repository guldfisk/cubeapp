# Generated by Django 2.2.5 on 2019-09-19 14:20

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='VersionedCube',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('name', models.CharField(max_length=128)),
                ('description', models.TextField()),
                ('author', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Invite',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('key_hash', models.CharField(max_length=255, unique=True)),
                ('email', models.CharField(max_length=255)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('claimed_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='invite', to=settings.AUTH_USER_MODEL)),
                ('issued_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='issued_invitations', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='CubeRelease',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('checksum', models.CharField(max_length=256)),
                ('name', models.CharField(max_length=64)),
                ('intended_size', models.PositiveIntegerField()),
                ('cube_content', models.TextField()),
                ('versioned_cube', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='releases', to='api.VersionedCube')),
            ],
            options={
                'ordering': ('-created_at',),
            },
        ),
        migrations.CreateModel(
            name='CubePatch',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('description', models.TextField()),
                ('content', models.TextField()),
                ('author', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                ('versioned_cube', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='deltas', to='api.VersionedCube')),
            ],
        ),
        migrations.CreateModel(
            name='ConstrainedNodes',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('constrained_nodes_content', models.TextField()),
                ('group_map_content', models.TextField()),
                ('release', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='constrained_nodes', to='api.CubeRelease')),
            ],
        ),
        migrations.CreateModel(
            name='LapChangePdf',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('pdf_url', models.CharField(max_length=511)),
                ('original_release', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='lap_pdf_originating_from_this', to='api.CubeRelease')),
                ('resulting_release', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='lap_pdf_resulting_in_this', to='api.CubeRelease')),
            ],
            options={
                'unique_together': {('original_release', 'resulting_release')},
            },
        ),
        migrations.CreateModel(
            name='DistributionPossibility',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('content', models.TextField()),
                ('pdf_url', models.CharField(max_length=511, null=True)),
                ('patch_checksum', models.CharField(max_length=255)),
                ('distribution_checksum', models.CharField(max_length=255)),
                ('fitness', models.FloatField()),
                ('patch', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.CubePatch')),
            ],
            options={
                'unique_together': {('patch', 'distribution_checksum')},
            },
        ),
    ]
