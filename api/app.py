#!/usr/bin/env python

import logging
from datetime import datetime

from flask import Flask, request
from flask_restful import Resource, Api
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow

from webargs.flaskparser import use_kwargs

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////tmp/test.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
ma = Marshmallow(app)
api = Api(app)


class Review(db.Model):
    api_key = db.Column(db.String(36), primary_key=True)
    timestamp = db.Column(db.DateTime, primary_key=True,
                          default=datetime.utcnow)
    radicals_correct = db.Column(db.Integer, nullable=False)
    kanji_correct = db.Column(db.Integer, nullable=False)
    vocab_correct = db.Column(db.Integer, nullable=False)
    total_radicals = db.Column(db.Integer, nullable=False)
    total_kanji = db.Column(db.Integer, nullable=False)
    total_vocab = db.Column(db.Integer, nullable=False)
    percent_correct = db.Column(db.Integer, nullable=False)


class ReviewSchema(ma.ModelSchema):
    class Meta:
        model = Review


review_schema = ReviewSchema()
reviews_schema = ReviewSchema(many=True)


class GetReviewsQuerySchema(ma.Schema):
    api_key = ma.Str(required=True)


get_reviews_query_schema = GetReviewsQuerySchema()


class ReviewResource(Resource):

    @use_kwargs(get_reviews_query_schema)
    def get(self, api_key):
        reviews = Review.query.filter_by(api_key=api_key).all()
        logger.info('Retrieved reviews for api_key: %s', api_key)
        return reviews_schema.dump(reviews), 200

    def post(self):
        review = review_schema.load(request.json)
        db.session.add(review)
        db.session.commit()
        logger.info('Stored review for api_key: %s and timestamp %s',
                    review.api_key, review.timestamp)
        return review_schema.dump(review), 201


api.add_resource(ReviewResource, '/api/v1/reviews')
