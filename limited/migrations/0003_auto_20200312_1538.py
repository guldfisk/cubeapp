# Generated by Django 3.0.3 on 2020-03-12 15:38

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('limited', '0002_auto_20200305_1035'),
    ]

    operations = [
        migrations.DeleteModel(
            name='AllCardsRespectRarityBoosterSpecification',
        ),
        migrations.CreateModel(
            name='AllCardsBoosterSpecification',
            fields=[
            ],
            options={
                'proxy': True,
                'indexes': [],
                'constraints': [],
            },
            bases=('limited.boosterspecification',),
        ),
        migrations.AddField(
            model_name='boosterspecification',
            name='respect_printings',
            field=models.BooleanField(null=True),
        ),
        migrations.AlterField(
            model_name='boosterspecification',
            name='type',
            field=models.CharField(choices=[('limited.expansionboosterspecification', 'expansion booster specification'), ('limited.allcardsboosterspecification', 'all cards booster specification'), ('limited.cubeboosterspecification', 'cube booster specification')], db_index=True, max_length=255),
        ),
    ]