// Libraries
import {Resolver, Query, Arg, Mutation} from 'type-graphql';
import {ObjectID} from 'mongodb';

// Model
import {Question, QuestionModel} from './question.model';
import {QuizModel} from '../quiz/quiz.model';

// Utils + Types + Scalars
import {ObjectIdScalar} from '../scalars';
import {QuestionInput, QuestionUpdateInput} from './question.type';

@Resolver(() => Question)
export default class QuestionResolvers {
  /**
   * getQuestions query takes an array of QuestionIds as a parameter and returns an array of the Questions
   * If no ids are passed (empty array), all the Questions will be returned.
   */
  async getQuestions(
    @Arg('ids', () => [ObjectIdScalar]) ids: ObjectID[],
  ): Promise<(Question | null)[]> {
    // TODO: Use context to allow requests only with the role of admin to proceed ahead
    try {
      if (ids.length === 0) {
        return await QuestionModel.find({});
      }

      return await Promise.all(
        ids.map(async questionId => QuestionModel.findById(questionId)),
      );
    } catch (error) {
      return error;
    }
  }

  /**
   * getQuestionsForQuiz query takes an array of QuizIds as a parameter and returns
   * a 2 dimensional array containing the questions for each quiz.
   * If no ids are passed, a bad request error is thrown.
   */
  @Query(() => [Question])
  async getQuestionsForQuiz(
    @Arg('ids', () => [ObjectIdScalar]) ids: ObjectID[],
  ): Promise<Promise<Promise<Question | null>[] | undefined>[]> {
    // TODO: Use context for the appropriate permissions to proceed ahead.

    if (ids.length && ids.length === 0) {
      throw new Error('Bad Request: Missing Parameters');
    }

    try {
      const quizzes = await Promise.all(
        ids.map(async quizId => QuizModel.findById(quizId)),
      );
      const questionsArray = quizzes.map(quiz => quiz?.questions);

      return questionsArray.map(async questions =>
        questions?.map(async questionId => {
          const question = await QuestionModel.findById(questionId);
          return question;
        }),
      );
    } catch (error) {
      return error;
    }
  }

  /**
   * createQuestions mutation gets an array of questions as parameter which are then added to the DB
   * If empty array provided bad request error is thrown.
   */
  @Mutation(() => [Question])
  async createQuestions(
    @Arg('questionDetails', () => [QuestionInput]) questionDetails: Question[],
  ): Promise<(Question | null)[]> {
    // TODO: Use context to check permissions

    try {
      if (questionDetails.length === 0) {
        throw new Error('Bad Request: Missing Parameters');
      }

      return await Promise.all(
        questionDetails.map(async questionDetail => {
          const {question, options, answer, positiveMark, explanation} =
            questionDetail;

          if (
            !question ||
            !options ||
            !answer ||
            !positiveMark ||
            !explanation
          ) {
            throw new Error('Bad Request: Missing Parameters');
          }

          return QuestionModel.create(questionDetail);
        }),
      );
    } catch (error) {
      return error;
    }
  }

  /**
   * updateQuestions takes an array of objects where the object contains the id of the question to be updated
   * and updateObject
   * If the array is empty a Bad request error is thrown.
   */
  @Mutation(() => [Question])
  async updateQuestions(
    @Arg('questionDetails', () => [QuestionUpdateInput])
    questionUpdatesArray: QuestionUpdateInput[],
  ): Promise<(Question | null)[]> {
    // TODO: Use context to check permissions

    try {
      if (questionUpdatesArray.length === 0) {
        throw new Error('Bad Request: Missing Parameters');
      }

      return await Promise.all(
        questionUpdatesArray.map(async ({id, updates}) =>
          QuestionModel.findByIdAndUpdate(id, updates, {new: true}),
        ),
      );
    } catch (error) {
      return error;
    }
  }

  /**
   * deleteQuestions takes an array of question ids to be deleted.
   * If the array is empty a bad request error is thrown
   */
  @Mutation(() => [Question])
  async deleteQuiz(
    @Arg('ids', () => ObjectIdScalar) ids: ObjectID[],
  ): Promise<(Question | null)[]> {
    // TODO: Use context to allow requests only with the role of admin to proceed ahead
    try {
      if (ids.length === 0) {
        throw new Error('Bad Request: Missing Parametes');
      }

      return await Promise.all(
        ids.map(async questionId =>
          QuestionModel.findByIdAndDelete(questionId),
        ),
      );
    } catch (error) {
      return error;
    }
  }
}
