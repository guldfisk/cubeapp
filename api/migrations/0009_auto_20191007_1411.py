# Generated by Django 2.2.5 on 2019-10-07 14:11

from django.db import migrations, models
import django.db.models.deletion
import utils.methods


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0008_auto_20191007_1321'),
    ]

    operations = [
        migrations.AddField(
            model_name='cubepatch',
            name='forked_from',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='forks', to='api.CubePatch'),
        ),
        migrations.AddField(
            model_name='cubepatch',
            name='name',
            field=models.CharField(default=utils.methods.get_random_name, max_length=127),
        ),
    ]