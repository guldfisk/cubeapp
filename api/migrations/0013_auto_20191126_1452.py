# Generated by Django 2.2.7 on 2019-11-26 14:52

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0012_distributionpossibility_release'),
    ]

    operations = [
        migrations.AddField(
            model_name='distributionpossibility',
            name='added_pdf_url',
            field=models.CharField(max_length=511, null=True),
        ),
        migrations.AddField(
            model_name='distributionpossibility',
            name='removed_pdf_url',
            field=models.CharField(max_length=511, null=True),
        ),
    ]
