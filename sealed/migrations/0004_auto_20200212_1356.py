# Generated by Django 3.0.2 on 2020-02-12 13:56

from django.conf import settings
from django.db import migrations, models
import sealed.models
import utils.fields


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('sealed', '0003_auto_20200212_1027'),
    ]

    operations = [
        migrations.AddField(
            model_name='sealedsession',
            name='state',
            field=utils.fields.EnumField(default=sealed.models.SealedSession.SealedSessionState['DECK_BUILDING'], enum_type='sealed.models.SealedSessionState'),
        ),
        migrations.AlterField(
            model_name='pool',
            name='key',
            field=models.CharField(max_length=63, unique=True),
        ),
        migrations.AlterUniqueTogether(
            name='pool',
            unique_together={('session', 'user')},
        ),
    ]