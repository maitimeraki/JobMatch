import { Request, Response, NextFunction } from "express";
import { postService } from "../services/post.service.js";

export const postController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await postService.createPost(req.user!.id, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getFeed(req: Request, res: Response, next: NextFunction) {
    try {
      const cursor = req.query.cursor as string | undefined;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 20;
      const mode = (req.query.mode as string) || "following";
      const category = req.query.category as string | undefined;
      const authorId = req.query.authorId as string | undefined;
      const result = await postService.getFeed(req.user!.id, cursor, limit, mode, category, authorId);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async getPost(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await postService.getPost(req.params.id, req.user?.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await postService.deletePost(req.params.id, req.user!.id);
      res.json({ success: true, data: { message: "Post deleted" } });
    } catch (error) {
      next(error);
    }
  },

  async toggleLike(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await postService.toggleLike(
        req.params.id,
        req.user!.id
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async addComment(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await postService.addComment(
        req.params.id,
        req.user!.id,
        req.body.content
      );
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getComments(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await postService.getComments(req.params.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
