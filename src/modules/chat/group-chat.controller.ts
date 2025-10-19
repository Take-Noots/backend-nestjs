// src/modules/group-chat/group-chat.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpException,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GroupChatService } from './group-chat.service';
import { CreateGroupChatDto } from './dto/create-group-chat.dto';
import { SendGroupMessageDto } from './dto/send-group-message.dto';
import { UpdateGroupChatDto } from './dto/update-group-chat.dto';
import { AddRemoveMemberDto } from './dto/add-remove-member.dto';
import { CloudinaryService } from '../../common/services/cloudinary.service';

@Controller('chat/group')
export class GroupChatController {
  constructor(
    private readonly groupChatService: GroupChatService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post('create')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createGroupChat(@Body() createGroupChatDto: CreateGroupChatDto) {
    try {
      console.log(
        '🔥 Received group chat creation request:',
        createGroupChatDto,
      );

      // Basic validation
      if (
        !createGroupChatDto.name ||
        !createGroupChatDto.createdBy ||
        !createGroupChatDto.memberIds
      ) {
        console.log('❌ Missing required fields');
        throw new HttpException(
          'Name, createdBy, and memberIds are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (
        !Array.isArray(createGroupChatDto.memberIds) ||
        createGroupChatDto.memberIds.length < 2
      ) {
        console.log('❌ Insufficient members');
        throw new HttpException(
          'At least 2 members are required besides the creator',
          HttpStatus.BAD_REQUEST,
        );
      }

      const result =
        await this.groupChatService.createGroupChat(createGroupChatDto);
      console.log('✅ Group chat creation successful');
      return result;
    } catch (error) {
      console.error('❌ Group chat creation error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        stack: error.stack?.substring(0, 500),
      });

      if (error.status === HttpStatus.BAD_REQUEST) {
        throw error;
      }

      throw new HttpException(
        `Failed to create group chat: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':userId')
  async getUserGroupChats(@Param('userId') userId: string) {
    try {
      return await this.groupChatService.getUserGroupChats(userId);
    } catch (error) {
      console.error('❌ Error in getUserGroupChats:', error);
      throw new HttpException(
        `Failed to fetch user group chats: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('messages/:groupChatId')
  async getGroupChatMessages(@Param('groupChatId') groupChatId: string) {
    try {
      return await this.groupChatService.getGroupChatMessages(groupChatId);
    } catch (error) {
      console.error('❌ Error in getGroupChatMessages:', error);
      if (error.status === HttpStatus.NOT_FOUND) {
        throw error;
      }
      throw new HttpException(
        `Failed to fetch group chat messages: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('details/:groupChatId')
  async getGroupChatDetails(@Param('groupChatId') groupChatId: string) {
    try {
      return await this.groupChatService.getGroupChatDetails(groupChatId);
    } catch (error) {
      console.error('❌ Error in getGroupChatDetails:', error);
      if (error.status === HttpStatus.NOT_FOUND) {
        throw error;
      }
      throw new HttpException(
        `Failed to fetch group chat details: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('send')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async sendGroupMessage(@Body() sendGroupMessageDto: SendGroupMessageDto) {
    try {
      return await this.groupChatService.sendGroupMessage(sendGroupMessageDto);
    } catch (error) {
      console.error('❌ Error in sendGroupMessage:', error);
      if (
        error.status === HttpStatus.BAD_REQUEST ||
        error.status === HttpStatus.NOT_FOUND
      ) {
        throw error;
      }
      throw new HttpException(
        `Failed to send group message: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('update/:groupChatId')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateGroupChat(
    @Param('groupChatId') groupChatId: string,
    @Body() updateGroupChatDto: UpdateGroupChatDto,
  ) {
    try {
      return await this.groupChatService.updateGroupChat(
        groupChatId,
        updateGroupChatDto,
      );
    } catch (error) {
      console.error('❌ Error in updateGroupChat:', error);
      if (
        error.status === HttpStatus.BAD_REQUEST ||
        error.status === HttpStatus.NOT_FOUND
      ) {
        throw error;
      }
      throw new HttpException(
        `Failed to update group chat: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('addMember')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async addMemberToGroup(@Body() addMemberDto: AddRemoveMemberDto) {
    try {
      return await this.groupChatService.addMemberToGroup(
        addMemberDto.groupChatId,
        addMemberDto.userId,
      );
    } catch (error) {
      console.error('❌ Error in addMemberToGroup:', error);
      if (
        error.status === HttpStatus.BAD_REQUEST ||
        error.status === HttpStatus.NOT_FOUND
      ) {
        throw error;
      }
      throw new HttpException(
        `Failed to add member to group: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('removeMember')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async removeMemberFromGroup(@Body() removeMemberDto: AddRemoveMemberDto) {
    try {
      return await this.groupChatService.removeMemberFromGroup(
        removeMemberDto.groupChatId,
        removeMemberDto.userId,
      );
    } catch (error) {
      console.error('❌ Error in removeMemberFromGroup:', error);
      if (
        error.status === HttpStatus.BAD_REQUEST ||
        error.status === HttpStatus.NOT_FOUND
      ) {
        throw error;
      }
      throw new HttpException(
        `Failed to remove member from group: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('leaveGroup')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async leaveGroup(@Body() leaveGroupDto: AddRemoveMemberDto) {
    try {
      return await this.groupChatService.leaveGroup(
        leaveGroupDto.groupChatId,
        leaveGroupDto.userId
      );
    } catch (error) {
      console.error('❌ Error in leaveGroup:', error);
      if (error.status === HttpStatus.BAD_REQUEST || error.status === HttpStatus.NOT_FOUND) {
        throw error;
      }
      throw new HttpException(
        `Failed to leave group: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':groupChatId/upload-group-icon')
  @UseInterceptors(FileInterceptor('groupIcon'))
  async uploadGroupIcon(
    @Param('groupChatId') groupChatId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      if (!file) {
        return {
          success: false,
          message: 'No file provided',
        };
      }

      // Upload to Cloudinary
      const imageUrl = await this.cloudinaryService.uploadImage(
        file,
        undefined, // folder not needed when using preset
        'group_icon_preset',
      );

      // Update group chat with new icon URL
      const result = await this.groupChatService.updateGroupChat(groupChatId, {
        groupIcon: imageUrl,
      });

      return {
        success: true,
        message: 'Group icon uploaded successfully',
        imageUrl,
        groupChat: result,
      };
    } catch (error) {
      console.error('❌ Error in uploadGroupIcon:', error);
      return {
        success: false,
        message: `Failed to upload group icon: ${error.message}`,
      };
    }
  }

  @Post(':groupChatId/upload-group-icon-base64')
  async uploadGroupIconBase64(
    @Param('groupChatId') groupChatId: string,
    @Body() body: { imageData: string },
  ) {
    try {
      if (!body.imageData) {
        return {
          success: false,
          message: 'No image data provided',
        };
      }

      // Upload to Cloudinary
      const imageUrl = await this.cloudinaryService.uploadImageFromBase64(
        body.imageData,
        undefined, // folder not needed when using preset
        'group_icon_preset',
      );

      // Update group chat with new icon URL
      const result = await this.groupChatService.updateGroupChat(groupChatId, {
        groupIcon: imageUrl,
      });

      return {
        success: true,
        message: 'Group icon uploaded successfully',
        imageUrl,
        groupChat: result,
      };
    } catch (error) {
      console.error('❌ Error in uploadGroupIconBase64:', error);
      return {
        success: false,
        message: `Failed to upload group icon: ${error.message}`,
      };
    }
  }

  @Delete(':groupChatId')
  async deleteGroupChat(
    @Param('groupChatId') groupChatId: string,
    @Body('userId') userId: string,
  ) {
    try {
      await this.groupChatService.deleteGroupChat(groupChatId, userId);
      return { message: 'Group chat deleted successfully' };
    } catch (error) {
      console.error('❌ Error in deleteGroupChat:', error);
      if (
        error.status === HttpStatus.BAD_REQUEST ||
        error.status === HttpStatus.NOT_FOUND
      ) {
        throw error;
      }
      throw new HttpException(
        `Failed to delete group chat: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
